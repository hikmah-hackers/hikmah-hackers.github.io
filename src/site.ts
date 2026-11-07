/**
 * Everything you are likely to change lives here.
 */
export const SITE = {
  name: 'Hikmah Hackers',
  host: 'Darul Uloom Michigan',
  tagline: 'Learn to code. Build with purpose.',
  description:
    'A free weekly coding program for grades 7–10 at Darul Uloom Michigan. Learn Python, build projects, and compete.',
  classDay: 'Friday',
  classTime: '', // e.g. '5:00–5:45 PM'. Leave empty to hide.
  timeZone: 'America/Detroit',
  contactEmail: 'faiyajr@umich.edu',

  editor: {
    name: 'Programiz online Python editor',
    url: 'https://www.programiz.com/python-programming/online-compiler/',
  },
  backupEditor: {
    name: 'Online Python',
    url: 'https://www.online-python.com/',
  },

  /**
   * The Google Apps Script web-app URL that receives submissions
   * (see apps-script/README.md). Empty = the form shows "not open yet".
   */
  submitEndpoint:
    'https://script.google.com/macros/s/AKfycbzGIs69fC0v49TkUaxtnmr1uD2Veb_MrJjdvuqr3HNWgNMNsI_LzjdhRxxnrDI24qJb/exec',

  /**
   * The enrollment form's public link (the Sign up button opens it). Get it from
   * `<submitEndpoint>?info=signup`. Empty = the Sign up page says sign-ups aren't open yet.
   */
  signupFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSf-Oqw4GADEmL6O5PNXDxf7ntLsjTV0CZUEASXOmYklLHBs-w/viewform',
} as const;

export const NAV = [
  { href: '/lessons', label: 'Lessons' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/guide', label: 'Guide' },
  { href: '/signup', label: 'Sign up' },
] as const;

export const LEGAL = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/code-of-conduct', label: 'Code of conduct' },
  { href: '/accessibility', label: 'Accessibility' },
] as const;
