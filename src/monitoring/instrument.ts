import * as Sentry from '@sentry/react'
import { env } from '../config/env'
import { sanitizeEvent } from './privacy'

if (env.sentry.dsn) {
  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.sentry.environment,
    release: env.sentry.release,
    enabled: import.meta.env.PROD,
    dataCollection: {
      userInfo: false, cookies: false, httpHeaders: false, httpBodies: [],
      urlQueryParams: false, databaseQueryData: false, stackFrameVariables: false,
      frameContextLines: 0,
    },
    beforeSend: sanitizeEvent,
  })
}

export const reactErrorHandler = Sentry.reactErrorHandler
