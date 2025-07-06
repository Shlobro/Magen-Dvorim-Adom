// frontend/src/services/inquiryApi.js
import { inquiryService } from './firebaseService';

export async function fetchCoordinatorInquiries(coordinatorId) {
  return await inquiryService.getInquiries(coordinatorId);
}

export async function takeOwnership(inquiryId, coordinatorId) {
  return await inquiryService.takeOwnership(inquiryId, coordinatorId);
}

export async function releaseOwnership(inquiryId, coordinatorId) {
  return await inquiryService.releaseOwnership(inquiryId);
}

export async function fetchVolunteerInquiries(volunteerId) {
  return await inquiryService.getVolunteerInquiries(volunteerId);
}

export async function updateInquiryStatus(inquiryId, status, closureReason = null, coordinatorId = null) {
  return await inquiryService.updateInquiryStatus(inquiryId, status, closureReason, coordinatorId);
}

export async function reassignVolunteer(inquiryId, newVolunteerId) {
  return await inquiryService.reassignVolunteer(inquiryId, newVolunteerId);
}
