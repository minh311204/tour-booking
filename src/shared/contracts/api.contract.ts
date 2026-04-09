import { initContract } from '@ts-rest/core'
import { authContract, userContract } from './user.contract'
import { tourContract } from './tour.contract'
import { locationContract } from './location.contract'
import { bookingContract } from './booking.contract'
import { aiContract } from './ai.contract'
import { supplierContract } from './supplier.contract'
import { wishlistContract } from './wishlist.contract'
import { notificationContract } from './notification.contract'
import { preferenceContract } from './preference.contract'

const c = initContract()

export const contract = c.router({
  auth: c.router(authContract, {
    pathPrefix: '/auth'
  }),

  user: c.router(userContract, {
    pathPrefix: '/users'
  }),

  location: c.router(locationContract, {
    pathPrefix: '/locations'
  }),

  tour: c.router(tourContract, {
    pathPrefix: '/tours'
  }),

  booking: c.router(bookingContract, {
    pathPrefix: '/bookings',
  }),

  ai: c.router(aiContract, {
    pathPrefix: '/ai',
  }),

  supplier: c.router(supplierContract, {
    pathPrefix: '/suppliers',
  }),

  wishlist: c.router(wishlistContract, {
    pathPrefix: '/wishlist',
  }),

  notification: c.router(notificationContract, {
    pathPrefix: '/notifications',
  }),

  preference: c.router(preferenceContract, {
    pathPrefix: '/preferences',
  }),
})
