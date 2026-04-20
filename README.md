<div align="center">
  <h1>Taipei Day Trip</h1>
  <p>
    <a href="http://3.106.102.237/"><b>Website</b></a> ｜
    <a href="#features"><b>Features</b></a> ｜
    <a href="#tech-stack"><b>Tech Stack</b></a> ｜
    <a href="#demo"><b>Demo</b></a>
  </p>
</div>

**Taipei Day Trip** is a comprehensive full-stack e-commerce travel platform designed to enhance the exploration of Taipei. The project provides a seamless user experience by integrating attraction discovery, itinerary booking, and secure third-party payment services.

![RWD](/static/images/multi_device_responsive_mockup.png)

#### Test Credit Card Payment Information
|   |  Card Number | Expiration | CVV |
|--------|--------|----------|----------|
| Valid Card | `4242 4242 4242 4242` | later than the current | `123` |

## Features
**Architecture & Deployment**
- **MVC Architecture:** Implemented a decoupled **Model-View-Controller** architecture for better scalability and code maintainability.

- **Cloud Deployment:** Successfully deployed and managed on AWS EC2.

**Frontend & User Experience**
- **Real-time Search:** Developed a fuzzy keyword search engine allowing users to find attractions based on nearby MRT stations efficiently.

- **UI/UX Optimization:** Utilized Infinite Scroll, Lazy Loading, and Progressive Image Loading paired with Skeleton Screens to minimize perceived latency and improve visual flow.

**Backend & API Design**
- **RESTful API:** Built a robust backend using FastAPI to handle core business logic within a decoupled architecture.

- **Database Schema:** Designed a structured MySQL relational database schema tailored for shopping carts and order management.

- **Connection Pooling:** Implemented Database Connection Pooling to ensure high-performance data management and resource efficiency.

**Payment & Security**
- **Payment Gateway:** Integrated TapPay API for secure credit card transactions, covering the full lifecycle of payment authorization and capturing.

- **Authentication & Authorization:** Developed a stateless user authentication system using JWT (JSON Web Tokens) for secure API access control.

- **Data Security:** Enforced industry-standard Password Hashing techniques to safeguard sensitive user information.

## Tech Stack
| **Category**            | **Technique**                                                                                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**            | ![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white) ![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javaScript&logoColor=black)      |
| **Backend**             | ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastAPI&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonWebTokens&logoColor=white) |
| **Database**            | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mySQL&logoColor=white)                                                                                                                                                                                                                    |
| **Third-party Service** | ![TapPay](https://img.shields.io/badge/TapPay-555?style=for-the-badge)                                                                                                                                                                                                                                                |
| **Version Control**     | ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=gitHub&logoColor=white)                                                                                                                    |
| **Deployment**          | ![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white) ![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

## Demo
### Home Page
![Infinite scroll](/static/images/home_page.gif)
- Attraction keyword search bar.
- MRT station horizontal scrollable list.
- Infinite scroll attraction thumbnails with lazy loading.

### Attraction Page
![Attractions](/static/images/attraction_page.gif)
- Attraction information and description.
- Image carousel.
- Booking date selection with dynamic pricing.

### Booking Page
![Booking](/static/images/booking_page.gif)
- TapPay payment integration.
- Form validation with dynamic feedback.

### Member Page
![Member](/static/images/member_page.gif)

## Database Schema
![ERD](/static/images/ERD.png)