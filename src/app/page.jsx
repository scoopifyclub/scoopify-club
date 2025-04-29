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
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to{' '}
          <span className="text-blue-600">
            Scoopify Club
          </span>
        </h1>

        <p className="mt-3 text-2xl">
          Dog waste removal service
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <a
            href="/about"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">About &rarr;</h3>
            <p className="mt-4 text-xl">
              Learn more about our services
            </p>
          </a>

          <a
            href="/pricing"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">Pricing &rarr;</h3>
            <p className="mt-4 text-xl">
              Check our competitive prices
            </p>
          </a>

          <a
            href="/contact"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">Contact &rarr;</h3>
            <p className="mt-4 text-xl">
              Get in touch with our team
            </p>
          </a>

          <a
            href="/auth/signin"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">Sign In &rarr;</h3>
            <p className="mt-4 text-xl">
              Access your account
            </p>
          </a>
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t">
        <p>© 2023 Scoopify Club. All rights reserved.</p>
      </footer>
    </div>
  )
}
