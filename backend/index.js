import { saveUser, saveInquiry, linkUserToInquiry } from "./services/firestoreService.js";



(async () => {
  await saveUser({
    id: "user123",
    name: "Alice",
    phone: "0501234567",
    location: "Jerusalem",
    userType: 2,
  });

  await saveInquiry({
    id: "inq456",
    date: "2025-04-02",
    height: 165,
    sex: "F",
    photo: "https://url-to-photo.jpg",
  });

  await linkUserToInquiry({
    userID: "user123",
    inquiryID: "inq456",
  });

  console.log("All data written successfully.");
})();
