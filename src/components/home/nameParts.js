import { safeString } from '../../utils/safeText'

export const surname = (name) => safeString(name).split(' ').pop() || 'The leader'
export const given = (name) => safeString(name).split(' ').slice(0, -1).join(' ')
