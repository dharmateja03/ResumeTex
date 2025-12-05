"""
Analytics routes for tracking usage metrics and user statistics
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter

from models.schemas import UserStats, OptimizationHistory, AnalyticsResponse
from routes.auth import get_current_user, get_current_user_optional
from shared_state import optimization_status_store

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory analytics store (in production, use proper database)
analytics_store: Dict[str, Dict[str, Any]] = {
    "user_metrics": defaultdict(dict),
    "global_metrics": {
        "total_optimizations": 0,
        "successful_optimizations": 0,
        "failed_optimizations": 0,
        "total_users": set(),
        "llm_provider_usage": Counter(),
        "daily_optimizations": defaultdict(int),
        "start_time": datetime.now()
    },
    "login_analytics": {
        "total_logins": 0,
        "total_signups": 0,
        "daily_logins": defaultdict(int),
        "daily_signups": defaultdict(int),
        "unique_users_today": set(),
        "login_events": [],  # Recent login events
        "auth_providers": Counter()
    },
    "token_usage": {
        "daily_tokens": defaultdict(lambda: {"input": 0, "output": 0, "total": 0}),
        "by_provider": defaultdict(lambda: {"tokens": 0, "model": ""}),
        "user_tokens": defaultdict(lambda: defaultdict(lambda: {"input": 0, "output": 0, "total": 0})),
        "recent_activity": []
    }
}

def track_optimization_event(user_email: str, optimization_data: Dict[str, Any], event_type: str):
    """Track optimization event for analytics"""
    try:
        # Update user metrics
        user_metrics = analytics_store["user_metrics"][user_email]
        
        if "total_optimizations" not in user_metrics:
            user_metrics["total_optimizations"] = 0
            user_metrics["successful_optimizations"] = 0
            user_metrics["failed_optimizations"] = 0
            user_metrics["first_optimization"] = datetime.now()
            user_metrics["llm_providers_used"] = set()
            user_metrics["companies_optimized"] = set()
        
        # Update counters based on event type
        if event_type == "started":
            user_metrics["total_optimizations"] += 1
            user_metrics["last_optimization"] = datetime.now()
            
            if "company_name" in optimization_data:
                user_metrics["companies_optimized"].add(optimization_data["company_name"])
            
            if "llm_provider" in optimization_data:
                user_metrics["llm_providers_used"].add(optimization_data["llm_provider"])
        
        elif event_type == "completed":
            user_metrics["successful_optimizations"] += 1
            
        elif event_type == "failed":
            user_metrics["failed_optimizations"] += 1
        
        # Update global metrics
        global_metrics = analytics_store["global_metrics"]
        global_metrics["total_users"].add(user_email)
        
        today = datetime.now().date().isoformat()
        
        if event_type == "started":
            global_metrics["total_optimizations"] += 1
            global_metrics["daily_optimizations"][today] += 1
            
            if "llm_provider" in optimization_data:
                global_metrics["llm_provider_usage"][optimization_data["llm_provider"]] += 1
        
        elif event_type == "completed":
            global_metrics["successful_optimizations"] += 1
            
        elif event_type == "failed":
            global_metrics["failed_optimizations"] += 1
        
        logger.info(f"📊 Tracked {event_type} event for user {user_email}")
        
    except Exception as e:
        logger.error(f"❌ Error tracking analytics event: {str(e)}")

def track_token_usage(user_email: str, provider: str, model: str, input_tokens: int, output_tokens: int, company_name: str = None):
    """Track LLM token usage"""
    try:
        token_store = analytics_store["token_usage"]
        today = datetime.now().date().isoformat()
        total_tokens = input_tokens + output_tokens
        
        # Update daily totals
        token_store["daily_tokens"][today]["input"] += input_tokens
        token_store["daily_tokens"][today]["output"] += output_tokens
        token_store["daily_tokens"][today]["total"] += total_tokens
        
        # Update by provider
        token_store["by_provider"][provider]["tokens"] += total_tokens
        token_store["by_provider"][provider]["model"] = model
        
        # Update user tokens
        token_store["user_tokens"][user_email][today]["input"] += input_tokens
        token_store["user_tokens"][user_email][today]["output"] += output_tokens
        token_store["user_tokens"][user_email][today]["total"] += total_tokens
        
        # Add to recent activity (keep last 100)
        activity = {
            "user_email": user_email,
            "timestamp": datetime.now().isoformat(),
            "provider": provider,
            "model": model,
            "tokens": total_tokens,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "company_name": company_name
        }
        token_store["recent_activity"].append(activity)
        if len(token_store["recent_activity"]) > 100:
            token_store["recent_activity"] = token_store["recent_activity"][-100:]
        
        logger.info(f"📊 Tracked {total_tokens} tokens for {user_email} ({provider}/{model})")
        
    except Exception as e:
        logger.error(f"❌ Error tracking token usage: {str(e)}")

@router.get("/usage")
async def get_token_usage(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get LLM token usage analytics (like Claude Console)"""
    user_email = current_user.get('email', 'unknown')
    logger.info(f"📊 Getting token usage for: {user_email}")

    try:
        token_store = analytics_store["token_usage"]
        user_tokens = token_store["user_tokens"].get(user_email, {})

        # Calculate totals
        total_input = sum(day_data["input"] for day_data in user_tokens.values())
        total_output = sum(day_data["output"] for day_data in user_tokens.values())
        total_tokens = total_input + total_output

        # Get last 7 days of usage
        daily_usage = []
        for i in range(6, -1, -1):  # Last 7 days, most recent last
            day = (datetime.now().date() - timedelta(days=i)).isoformat()
            day_data = user_tokens.get(day, {"input": 0, "output": 0, "total": 0})
            daily_usage.append({
                "date": day,
                "tokens": day_data["total"],
                "input_tokens": day_data["input"],
                "output_tokens": day_data["output"]
            })

        # Get provider breakdown for this user
        by_provider = {}
        for activity in token_store["recent_activity"]:
            if activity["user_email"] == user_email:
                provider = activity["provider"]
                if provider not in by_provider:
                    by_provider[provider] = {
                        "tokens": 0,
                        "model": activity["model"]
                    }
                by_provider[provider]["tokens"] += activity["tokens"]

        # Get user's recent activity
        recent_activity = [
            activity for activity in token_store["recent_activity"]
            if activity["user_email"] == user_email
        ][-10:]  # Last 10 activities

        usage_data = {
            "total_tokens": total_tokens,
            "input_tokens": total_input,
            "output_tokens": total_output,
            "daily_usage": daily_usage,
            "by_provider": by_provider,
            "recent_activity": recent_activity
        }

        logger.info(f"📊 Token usage - Total: {total_tokens}, Daily entries: {len(daily_usage)}")
        return usage_data

    except Exception as e:
        logger.error(f"❌ Error getting token usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get token usage"
        )

@router.get("/resume-stats")
async def get_resume_stats(
    period: str = "7d",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get resume generation statistics with time period filtering"""
    user_email = current_user.get('email', 'unknown')
    logger.info(f"📊 Getting resume stats for: {user_email} (period: {period})")

    try:
        # Calculate date range based on period
        end_date = datetime.now().date()
        if period == "7d":
            days = 7
            start_date = end_date - timedelta(days=6)
        elif period == "30d":
            days = 30
            start_date = end_date - timedelta(days=29)
        elif period == "1yr":
            days = 365
            start_date = end_date - timedelta(days=364)
        else:  # all
            days = 365  # Show last year max for "all"
            start_date = end_date - timedelta(days=364)

        # Count resumes generated per day
        daily_counts = defaultdict(int)
        total_resumes = 0

        for opt_id, opt_data in optimization_status_store.items():
            if opt_data.get("user_email") == user_email:
                created_at = opt_data.get("created_at")
                if created_at:
                    opt_date = created_at.date()
                    if start_date <= opt_date <= end_date:
                        date_str = opt_date.isoformat()
                        daily_counts[date_str] += 1
                        total_resumes += 1

        # Build daily data array
        daily_data = []
        for i in range(days - 1, -1, -1):  # Most recent last
            day = (end_date - timedelta(days=i)).isoformat()
            count = daily_counts.get(day, 0)
            daily_data.append({
                "date": day,
                "count": count
            })

        stats = {
            "period": period,
            "total_resumes": total_resumes,
            "daily_data": daily_data,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }

        logger.info(f"📊 Resume stats - Period: {period}, Total: {total_resumes}, Days: {len(daily_data)}")
        return stats

    except Exception as e:
        logger.error(f"❌ Error getting resume stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get resume statistics"
        )

@router.get("/user-stats", response_model=UserStats)
async def get_user_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user's optimization statistics"""
    user_email = current_user.get('email', 'unknown')
    logger.info(f"📊 Getting user stats for: {user_email}")
    
    try:
        user_metrics = analytics_store["user_metrics"].get(user_email, {})
        
        # Calculate optimizations today
        today = datetime.now().date()
        optimizations_today = 0
        
        # Check optimization store for today's optimizations by this user
        for opt_data in optimization_status_store.values():
            if (opt_data.get("user_email") == user_email and 
                opt_data.get("created_at") and
                opt_data["created_at"].date() == today):
                optimizations_today += 1
        
        # Get most recent optimization
        most_recent = user_metrics.get("last_optimization")
        
        # Get favorite LLM provider
        providers_used = user_metrics.get("llm_providers_used", set())
        favorite_llm = max(providers_used, key=lambda x: sum(1 for opt in optimization_status_store.values() 
                                                           if opt.get("user_email") == user_email and opt.get("llm_provider") == x), 
                          default=None) if providers_used else None
        
        stats = UserStats(
            total_optimizations=user_metrics.get("total_optimizations", 0),
            optimizations_today=optimizations_today,
            most_recent_optimization=most_recent,
            favorite_llm_provider=favorite_llm
        )
        
        logger.info(f"📊 User stats - Total: {stats.total_optimizations}, Today: {stats.optimizations_today}")
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error getting user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user statistics"
        )

@router.get("/recent", response_model=List[OptimizationHistory])
async def get_recent_optimizations(
    limit: int = 10,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get user's recent optimization history"""
    user_email = current_user.get('email', 'unknown')
    logger.info(f"📋 Getting recent optimizations for: {user_email} (limit: {limit})")
    
    try:
        # Get user's optimizations from the store
        user_optimizations = []
        
        for opt_id, opt_data in optimization_status_store.items():
            if opt_data.get("user_email") == user_email:
                history_item = OptimizationHistory(
                    optimization_id=opt_id,
                    company_name=opt_data.get("company_name", "Unknown"),
                    created_at=opt_data.get("created_at", datetime.now()),
                    llm_provider=opt_data.get("llm_provider", "unknown"),
                    status=opt_data.get("status", "unknown")
                )
                user_optimizations.append(history_item)
        
        # Sort by creation time (most recent first) and limit
        user_optimizations.sort(key=lambda x: x.created_at, reverse=True)
        recent_optimizations = user_optimizations[:limit]
        
        logger.info(f"📋 Returning {len(recent_optimizations)} recent optimizations")
        return recent_optimizations
        
    except Exception as e:
        logger.error(f"❌ Error getting recent optimizations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent optimizations"
        )

@router.get("/dashboard", response_model=AnalyticsResponse)
async def get_user_dashboard(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get complete user analytics dashboard"""
    user_email = current_user.get('email', 'unknown')
    logger.info(f"📊 Getting analytics dashboard for: {user_email}")
    
    try:
        # Get user stats
        user_stats = await get_user_stats(current_user)
        
        # Get recent optimizations
        recent_optimizations = await get_recent_optimizations(5, current_user)
        
        response = AnalyticsResponse(
            user_stats=user_stats,
            recent_optimizations=recent_optimizations
        )
        
        logger.info(f"📊 Dashboard data prepared for {user_email}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error getting dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analytics dashboard"
        )

@router.get("/global-stats")
async def get_global_stats(current_user: Dict[str, Any] = Depends(get_current_user_optional)):
    """Get global system statistics (public endpoint)"""
    logger.info("📊 Getting global statistics")
    
    try:
        global_metrics = analytics_store["global_metrics"]
        
        # Calculate uptime
        uptime_seconds = (datetime.now() - global_metrics["start_time"]).total_seconds()
        uptime_hours = uptime_seconds / 3600
        
        # Get recent activity (last 7 days)
        recent_days = []
        for i in range(7):
            day = (datetime.now().date() - timedelta(days=i)).isoformat()
            recent_days.append({
                "date": day,
                "optimizations": global_metrics["daily_optimizations"].get(day, 0)
            })
        
        stats = {
            "total_optimizations": global_metrics["total_optimizations"],
            "successful_optimizations": global_metrics["successful_optimizations"],
            "failed_optimizations": global_metrics["failed_optimizations"],
            "success_rate": (global_metrics["successful_optimizations"] / max(global_metrics["total_optimizations"], 1)) * 100,
            "total_users": len(global_metrics["total_users"]),
            "uptime_hours": round(uptime_hours, 2),
            "popular_llm_providers": dict(global_metrics["llm_provider_usage"].most_common(5)),
            "recent_activity": recent_days
        }
        
        logger.info(f"📊 Global stats - Total optimizations: {stats['total_optimizations']}, Users: {stats['total_users']}")
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error getting global stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get global statistics"
        )

@router.post("/track-event")
async def track_custom_event(
    event_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user_optional)
):
    """Track custom analytics event"""
    user_email = current_user.get('email', 'anonymous') if current_user else 'anonymous'
    logger.info(f"📊 Tracking custom event from {user_email}: {event_data.get('event_type', 'unknown')}")
    
    try:
        event_type = event_data.get("event_type")
        
        if not event_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="event_type is required"
            )
        
        # Track the event
        track_optimization_event(user_email, event_data, event_type)
        
        return {"message": f"Event '{event_type}' tracked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error tracking custom event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track event"
        )

@router.get("/export")
async def export_user_data(
    format: str = "json",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Export user's analytics data"""
    user_email = current_user.get('email', 'unknown')
    logger.info(f"📤 Exporting analytics data for {user_email} (format: {format})")
    
    try:
        if format not in ["json", "csv"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supported formats: json, csv"
            )
        
        # Get user metrics
        user_metrics = analytics_store["user_metrics"].get(user_email, {})
        
        # Get user's optimization history
        recent_optimizations = await get_recent_optimizations(100, current_user)
        
        export_data = {
            "user_email": user_email,
            "export_date": datetime.now().isoformat(),
            "metrics": {
                "total_optimizations": user_metrics.get("total_optimizations", 0),
                "successful_optimizations": user_metrics.get("successful_optimizations", 0),
                "failed_optimizations": user_metrics.get("failed_optimizations", 0),
                "first_optimization": user_metrics.get("first_optimization").isoformat() if user_metrics.get("first_optimization") else None,
                "last_optimization": user_metrics.get("last_optimization").isoformat() if user_metrics.get("last_optimization") else None,
                "llm_providers_used": list(user_metrics.get("llm_providers_used", set())),
                "companies_optimized": list(user_metrics.get("companies_optimized", set()))
            },
            "optimization_history": [
                {
                    "optimization_id": opt.optimization_id,
                    "company_name": opt.company_name,
                    "created_at": opt.created_at.isoformat(),
                    "llm_provider": opt.llm_provider,
                    "status": opt.status
                }
                for opt in recent_optimizations
            ]
        }
        
        logger.info(f"📤 Exporting {len(recent_optimizations)} optimization records")
        
        if format == "json":
            return export_data
        else:
            # For CSV format, you'd implement CSV conversion here
            # For now, return JSON with a note
            return {
                "message": "CSV export not yet implemented",
                "data": export_data
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error exporting data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export data"
        )

@router.get("/health")
async def analytics_health():
    """Analytics service health check"""
    logger.info("🏥 Analytics service health check")
    
    try:
        global_metrics = analytics_store["global_metrics"]
        
        health_info = {
            "status": "healthy",
            "total_users_tracked": len(global_metrics["total_users"]),
            "total_events_tracked": global_metrics["total_optimizations"],
            "analytics_store_size": {
                "user_metrics": len(analytics_store["user_metrics"]),
                "global_metrics": len(global_metrics),
                "optimization_store": len(optimization_status_store)
            },
            "uptime_seconds": (datetime.now() - global_metrics["start_time"]).total_seconds()
        }
        
        logger.info("✅ Analytics service is healthy")
        return health_info
        
    except Exception as e:
        logger.error(f"❌ Analytics service health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Analytics service unhealthy: {str(e)}"
        )

# Hook to track optimization events from other services
def track_optimization_started(user_email: str, optimization_data: Dict[str, Any]):
    """Track when optimization starts"""
    track_optimization_event(user_email, optimization_data, "started")

def track_optimization_completed(user_email: str, optimization_data: Dict[str, Any]):
    """Track when optimization completes"""
    track_optimization_event(user_email, optimization_data, "completed")

def track_optimization_failed(user_email: str, optimization_data: Dict[str, Any]):
    """Track when optimization fails"""
    track_optimization_event(user_email, optimization_data, "failed")

# Login analytics tracking
def track_login_event(user_email: str, user_id: str, event_type: str, metadata: Dict[str, Any] = {}):
    """Track login or signup events"""
    try:
        login_analytics = analytics_store["login_analytics"]
        today = datetime.now().date().isoformat()

        # Create event record
        event = {
            "user_email": user_email,
            "user_id": user_id,
            "event_type": event_type,
            "timestamp": datetime.now(),
            "metadata": metadata
        }

        # Add to recent events (keep last 1000)
        login_analytics["login_events"].append(event)
        if len(login_analytics["login_events"]) > 1000:
            login_analytics["login_events"] = login_analytics["login_events"][-1000:]

        # Update counters
        if event_type == "login":
            login_analytics["total_logins"] += 1
            login_analytics["daily_logins"][today] += 1
            login_analytics["unique_users_today"].add(user_email)

        elif event_type == "signup":
            login_analytics["total_signups"] += 1
            login_analytics["daily_signups"][today] += 1

        # Track auth provider
        auth_provider = metadata.get("auth_provider", "unknown")
        login_analytics["auth_providers"][auth_provider] += 1

        # Update global user set
        analytics_store["global_metrics"]["total_users"].add(user_email)

        logger.info(f"📊 Tracked {event_type} event for user {user_email}")

    except Exception as e:
        logger.error(f"❌ Error tracking login event: {str(e)}")

@router.get("/login-stats")
async def get_login_stats(current_user: Dict[str, Any] = Depends(get_current_user_optional)):
    """Get login and signup statistics"""
    logger.info("📊 Getting login statistics")

    try:
        login_analytics = analytics_store["login_analytics"]
        today = datetime.now().date().isoformat()

        # Get recent activity (last 7 days)
        recent_days_logins = []
        recent_days_signups = []

        for i in range(7):
            day = (datetime.now().date() - timedelta(days=i)).isoformat()
            recent_days_logins.append({
                "date": day,
                "count": login_analytics["daily_logins"].get(day, 0)
            })
            recent_days_signups.append({
                "date": day,
                "count": login_analytics["daily_signups"].get(day, 0)
            })

        stats = {
            "total_logins": login_analytics["total_logins"],
            "total_signups": login_analytics["total_signups"],
            "logins_today": login_analytics["daily_logins"].get(today, 0),
            "signups_today": login_analytics["daily_signups"].get(today, 0),
            "unique_users_today": len(login_analytics["unique_users_today"]),
            "auth_providers": dict(login_analytics["auth_providers"]),
            "recent_logins": recent_days_logins,
            "recent_signups": recent_days_signups
        }

        logger.info(f"📊 Login stats - Total logins: {stats['total_logins']}, Signups: {stats['total_signups']}")
        return stats

    except Exception as e:
        logger.error(f"❌ Error getting login stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get login statistics"
        )

@router.get("/recent-logins")
async def get_recent_logins(
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get recent login events (admin only in production)"""
    logger.info(f"📋 Getting recent login events (limit: {limit})")

    try:
        login_analytics = analytics_store["login_analytics"]
        recent_events = login_analytics["login_events"][-limit:][::-1]  # Most recent first

        events = [
            {
                "user_email": event["user_email"],
                "user_id": event["user_id"],
                "event_type": event["event_type"],
                "timestamp": event["timestamp"].isoformat(),
                "auth_provider": event["metadata"].get("auth_provider", "unknown")
            }
            for event in recent_events
        ]

        logger.info(f"📋 Returning {len(events)} recent login events")
        return events

    except Exception as e:
        logger.error(f"❌ Error getting recent logins: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent logins"
        )