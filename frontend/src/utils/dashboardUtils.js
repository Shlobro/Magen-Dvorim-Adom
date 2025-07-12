// Dashboard utility functions for dynamic styling
export const getTableRowClasses = (isUnassigned, index) => {
  let classes = 'table-row';
  
  if (isUnassigned) {
    classes += ' unassigned';
  } else if (index % 2 === 0) {
    classes += ' even';
  } else {
    classes += ' odd';
  }
  
  return classes;
};

export const getVolunteerAssignmentClasses = (coordinatorId, currentUserId) => {
  return coordinatorId !== currentUserId ? 'volunteer-select disabled' : 'volunteer-select enabled';
};

export const getClosureSelectClasses = (coordinatorId, currentUserId) => {
  return coordinatorId !== currentUserId ? 'closure-select disabled' : 'closure-select enabled';
};

export const getActionButtonClasses = (baseClass, coordinatorId, currentUserId) => {
  if (coordinatorId !== currentUserId) {
    return `${baseClass} disabled`;
  }
  return baseClass;
};

export const getActionButtonStyle = (coordinatorId, currentUserId, enabledStyle, disabledStyle) => {
  return coordinatorId !== currentUserId ? disabledStyle : enabledStyle;
};

export const shouldShowButton = (status, coordinatorId, currentUserId, buttonType) => {
  switch (buttonType) {
    case 'takeOwnership':
      return !coordinatorId;
    case 'releaseOwnership':
      return coordinatorId === currentUserId;
    case 'assignVolunteer':
      return status === "נפתחה פנייה (טופס מולא)";
    case 'feedbackLink':
      return status === "הפנייה נסגרה";
    case 'noActions':
      return status !== "נפתחה פנייה (טופס מולא)" && status !== "הפנייה נסגרה";
    default:
      return false;
  }
};
