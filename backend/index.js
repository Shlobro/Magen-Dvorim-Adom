import { saveUser, saveInquiry, linkUserToInquiry } from "./firestoreService.js";
import { getUser } from './firestoreService.js';

app.get('/user/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).send("User not found");
  }
});


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
