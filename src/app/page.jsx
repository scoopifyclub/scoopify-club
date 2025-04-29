'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCircleInfo, faBroom, faCalendar, faStar, faCircleCheck, faTags, faMobileScreen, faCamera, faThumbsUp } from '@fortawesome/free-solid-svg-icons';

/**
 * Home page component
 * @returns {JSX.Element} The rendered component
 */
export default function Home() {
    return (<div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-neutral-900">
                Professional Dog Waste Removal
                <span className="text-primary block">Made Simple</span>
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                We keep your yard clean so you can enjoy more time with your pets.
                Join the club and experience hassle-free pet waste clean up.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors duration-200">
                  <FontAwesomeIcon icon={faPaw} className="mr-2 h-4 w-4"/>
                  Join the Club
                </Link>
                <Link href="/services" className="inline-flex items-center justify-center bg-white text-primary border-2 border-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200">
                  <FontAwesomeIcon icon={faCircleInfo} className="mr-2 h-4 w-4"/>
                  Learn More
                </Link>
                <Link href="/auth/scooper-signup" className="inline-flex items-center justify-center border-2 border-primary text-primary font-semibold px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors duration-200">
                  <FontAwesomeIcon icon={faBroom} className="mr-2 h-4 w-4"/>
                  Become a Scooper
                </Link>
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg" 
                alt="Happy dogs playing in a clean backyard" 
                fill 
                className="object-cover" 
                priority 
                onError={(e) => {
                  const target = e.target;
                  target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-neutral-900">
              Why Choose Scoopify Club?
            </h2>
            <p className="text-xl text-neutral-600">
              Our app-powered waste removal service takes the hassle out of maintaining a clean yard for your pets, with real-time tracking and complete control over your service schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faBroom} className="w-6 h-6 text-primary"/>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-900">Professional Service</h3>
                  <p className="text-neutral-600">Never wonder if your yard has been cleaned - receive email updates and view completion photos directly in your customer dashboard.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faCalendar} className="w-6 h-6 text-primary"/>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-900">Flexible Scheduling</h3>
                  <p className="text-neutral-600">Select your preferred service day and manage your entire schedule through your personalized dashboard - complete control at your fingertips.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faStar} className="w-6 h-6 text-primary"/>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-900">Quality Guaranteed</h3>
                  <p className="text-neutral-600">View before and after photos of each service in your dashboard, ensuring you always get the quality results you deserve.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-neutral-900">
              Smart Pet Waste Management
            </h2>
            <p className="text-xl text-neutral-600">
              Our innovative app-powered platform provides a modern solution to pet waste removal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <FontAwesomeIcon icon={faMobileScreen} className="w-8 h-8 text-primary"/>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900">Digital Dashboard</h3>
                <p className="text-neutral-600">Manage your services, view your cleaning history, and control your schedule all from one easy-to-use dashboard.</p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <FontAwesomeIcon icon={faCamera} className="w-8 h-8 text-primary"/>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900">Photo Verification</h3>
                <p className="text-neutral-600">Every service is documented with before and after photos, so you can see the results without stepping outside.</p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <FontAwesomeIcon icon={faThumbsUp} className="w-8 h-8 text-primary"/>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900">Satisfaction Tracking</h3>
                <p className="text-neutral-600">Rate each service and provide feedback directly through your dashboard to ensure continued quality.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image 
                  src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg" 
                  alt="Golden retriever relaxing in pristine backyard" 
                  fill 
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target;
                    target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                  }}
                />
              </div>
              <div className="space-y-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (<FontAwesomeIcon key={i} icon={faStar} className="h-5 w-5 text-yellow-500"/>))}
                </div>
                <blockquote className="text-2xl font-medium text-neutral-700 italic">
                  "Since using Scoopify Club, our backyard has become a clean, safe haven for our family and pets. The photo updates after each service give us complete peace of mind!"
                </blockquote>
                <div className="font-semibold text-neutral-900">
                  Jessica L. • Dog parent to Max & Bella
                </div>
                <p className="text-neutral-600">
                  Weekly service subscriber for 8 months
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex justify-center">
            <div className="grid grid-cols-3 gap-4 max-w-3xl">
              <div className="relative h-32 rounded-lg overflow-hidden">
                <Image 
                  src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg" 
                  alt="Dog playing in clean backyard" 
                  fill 
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target;
                    target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                  }}
                />
              </div>
              <div className="relative h-32 rounded-lg overflow-hidden">
                <Image 
                  src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg" 
                  alt="Manicured backyard perfect for pets" 
                  fill 
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target;
                    target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                  }}
                />
              </div>
              <div className="relative h-32 rounded-lg overflow-hidden">
                <Image 
                  src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg" 
                  alt="Beautiful pet-friendly yard" 
                  fill 
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target;
                    target.src = "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                  }}
                />
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready for a Cleaner Yard?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join Scoopify Club today and enjoy a clean, pet waste-free yard with full visibility and control through our innovative app. Spend less time cleaning and more time enjoying your outdoor space with your pets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="inline-flex items-center justify-center bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-neutral-100 transition-colors duration-200 shadow-lg">
                <FontAwesomeIcon icon={faCircleCheck} className="mr-2 h-4 w-4"/>
                Get Started Now
              </Link>
              <Link href="/pricing" className="inline-flex items-center text-white font-semibold hover:text-white/80 transition-colors duration-200 group">
                <FontAwesomeIcon icon={faTags} className="mr-2 h-4 w-4"/>
                View Pricing
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>);
}
