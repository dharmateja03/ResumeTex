import React, { useState } from 'react';
export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const testimonials = [{
    quote: 'ResumeTex transformed my resume and helped me land interviews at top tech companies. The LaTeX optimization was exactly what I needed.',
    name: 'Alex Johnson',
    role: 'Software Engineer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }, {
    quote: 'As a PhD candidate, my academic CV was complex. ResumeTex helped me optimize it for both academic and industry positions.',
    name: 'Sarah Williams',
    role: 'Research Scientist',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }, {
    quote: 'The API integration allowed me to customize the optimization process to my specific industry. Highly recommend for technical professionals.',
    name: 'Michael Chen',
    role: 'Data Analyst',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }];
  return <section className="py-12 bg-white grid-bg radial-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center opacity-0 animate-fade-in">
          <h2 className="text-base text-blue-600 font-switzer-bold tracking-wide uppercase">
            Testimonials
          </h2>
          <p className="mt-2 text-3xl leading-8 font-gambarino tracking-tight text-gray-900 sm:text-4xl">
            What Our Users Say
          </p>
        </div>
        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {testimonials.map((testimonial, index) => <div key={index} className={`relative bg-white p-6 rounded-xl shadow-md opacity-0 animate-fade-in transition-all duration-300 transform ${activeIndex === index ? 'scale-105 shadow-lg' : ''}`} style={{
            animationDelay: `${(index + 1) * 0.1}s`
          }} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
                <div className={`font-volkart italic mb-4 transition-all duration-300 ${activeIndex === index ? 'text-blue-600' : 'text-gray-600'}`}>
                  "{testimonial.quote}"
                </div>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 transition-all duration-300 ${activeIndex === index ? 'transform scale-110' : ''}`}>
                    <img className={`h-10 w-10 rounded-full ${activeIndex === index ? 'ring-2 ring-blue-400' : ''}`} src={testimonial.image} alt="" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-switzer-bold transition-colors duration-300 ${activeIndex === index ? 'text-blue-600' : 'text-gray-900'}`}>
                      {testimonial.name}
                    </p>
                    <p className="text-sm font-switzer-light text-gray-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </section>;
}