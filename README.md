Perfect, I’ll tidy this up into a clean and professional **README.md** format with clear sections, consistent tone, and proper English.

---

# 🌐 Anoma Intent Simulation

**Anoma Intent Simulation** is a web application consisting of a **backend** and a **frontend**.

* The **backend** handles API, database, authentication, and intent logic.
* The **frontend** provides the user interface and interactive features.

This project was built for **Intent Tuesday Redux** as a **prototype simulator** for intent-centric applications in **swap, bridge, and staking**.

---

## 👥 Team

* **Leader**: `@roxorwuzhere1411` (Wizard – idea architect)
* **Members**:

  1. `@taufn_1748` (Acolyte – ideas + backend & frontend developer)
  2. `@myr99` (Intent Master – ideas)
  3. `@liinnnnnn` (Intent Master – ideas)
  4. `@bubup_` (Master – ideas)
  5. `@rizkiramdan07` (Seeker – ideas + UX contributor)

---

## 📂 Project Structure

```
├── backend/   # API, database, authentication, and intent logic
├── frontend/  # Website user interface (UI/UX)
└── README.md  # Project documentation
```

---

## ⚙️ Backend

The `backend` folder includes:

* **API** → communication between server and frontend
* **Database** → user data management
* **Authentication & Authorization**
* **Business Logic** → intent engine for staking, swap, and leaderboard

---

## 🎨 Frontend

The `frontend` folder includes the **website interface** with these features:

### 🔑 Main Features

* **Landing Page** – user login/signup, data stored in backend
  ![Landing Page](https://github.com/user-attachments/assets/374de885-f2f1-49b0-beb9-aa932ee8555d)

* **Dashboard / Intent Form** – try intent-centric interactions (swap, bridge, staking), see leaderboard, pool, and user intents
  ![Dashboard](https://github.com/user-attachments/assets/5fc0b9ee-2a24-465b-90e3-f0a04d71de53)

* **Swap & Bridge Intent Form** – input amount, choose token, destination chain, privacy settings.

  * If matched with another user, you earn points.
  * If not, intents are matched with a solver bot from the Anoma chain that has liquidity pools.
    ![Swap Bridge](https://github.com/user-attachments/assets/ea1b1538-9d4c-4189-b145-6831539a0998)
    ![Swap Bridge Example](https://github.com/user-attachments/assets/d0e5d118-e58b-4b3d-9dd1-d4e58b227767)

* **Staking Intent Form** – select token, input amount, set APR, lock/flexible, minimum APY, and add a special note.

  * Your intent is matched with the best available pool.
    ![Staking](https://github.com/user-attachments/assets/62dd10a3-1e6a-4250-8819-54028c60b342)

* **Profile Portfolio** – check balances and transaction history.
  ![Portfolio](https://github.com/user-attachments/assets/376667db-36df-4894-90fb-01c6d56218df)
  ![Portfolio 2](https://github.com/user-attachments/assets/91159d90-62e0-4b19-afa9-c0537bb047f9)

* **Pools & Leaderboard** – view all user, bot, and solver intents, available staking pools, and intent-matching leaderboard.
  ![Pools](https://github.com/user-attachments/assets/fe0fb61b-a8d6-4867-84b9-1093986e07d2)
  ![Leaderboard](https://github.com/user-attachments/assets/82b07645-0806-4cbd-856c-fcfbd1df8939)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/username/repo-name.git
cd repo-name
```

### 2. Run Backend

```bash
cd backend
npm install
node app.js
```

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

---
