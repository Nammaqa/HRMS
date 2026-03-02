/**
 * Email Templates Index
 * Central export point for all email templates used in the system
 */

export { getGoodMorningReminderTemplate } from './goodMorningReminder';
export { getMidMorningReminderTemplate } from './midMorningReminder';
export { getEveningLogoutReminderTemplate } from './eveningLogoutReminder';
export { 
  getLeaveApprovalTemplate, 
  type LeaveApprovalData 
} from './leaveApprovalEmail';
export { getAutoLogoutWarningTemplate } from './autoLogoutWarning';

/**
 * Template Categories
 */
export enum EmailTemplateType {
  GOOD_MORNING = 'GOOD_MORNING',
  MID_MORNING = 'MID_MORNING',
  EVENING_LOGOUT = 'EVENING_LOGOUT',
  LEAVE_APPROVAL = 'LEAVE_APPROVAL',
  AUTO_LOGOUT_WARNING = 'AUTO_LOGOUT_WARNING',
}
