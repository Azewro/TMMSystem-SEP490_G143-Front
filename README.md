# TMMSystem-SEP490_G143
# Towel Manufacturing Management System - Group 143 Software Engineering Capstone Project - FPT Universary
# Supervisor
Nguyễn Văn An - AnNV22@fe.edu.vn
# Team Members
Nguyễn Anh Hùng - HE180711 (Leader) - Full Stack Developer

Nguyễn Thị Thu Hiền - HE172532 (Member) - BA/Tester

Nguyễn Thị Thủy - HE172416 (Member) - BA/Tester

Đỗ Hải Phong - HE181907 (Member) - Full Stack Developer

Lê Văn Đức - HE160559 (Member) - Front-end Developer/Tester

# Project Overview

- The Towel Manufacturing Management System (TMMS) is a graduation project aimed at building a towel production management system for My Duc Textile Company. Before the system, the company managed everything manually: tracking orders using Excel, communicating via text messages (Zalo), planning and recording production progress on paper. This fragmented management led to a lack of synchronization between departments, easy human error, and difficulty in consistently updating progress.

- The TMMS was created to solve these problems by synchronizing data between departments, automating the ordering process, tracking production progress in real time, standardizing quality control, and providing an overview dashboard for management. The system comprises a front-end (web user interface, developed using React.js + Vite, supporting WebSocket connectivity) and a back-end (Spring Boot service, MySQL database) that work together via REST APIs and WebSockets to digitize the entire management process.

# Key Features

*The TMMS system is divided into main modules, each containing corresponding front-end (user interface) and back-end (business process) functions:*

- Order Management: Receiving and processing requests for quotations (RFQs) from customers, creating purchase orders, and tracking order status from receipt to completion. The front-end provides an interface for customers/employees to enter requests, view quotations, and track order status; the back-end handles business process calculations, stores orders in the database, and updates order status according to production progress.

- Production Management: Planning production based on orders, dividing tasks among departments, and monitoring production progress at each stage. The front-end displays an interface for the planning department to schedule production and for supervisors to update actual progress; the back-end performs production schedule calculations, assigns tasks, saves the progress status of each stage, and synchronizes real-time data (serving the management dashboard). The system also integrates product quality management: quality control results at each stage are entered into the system instead of being manually recorded.

- Equipment Management: Managing information on machinery and equipment in the factory, including maintenance schedules and the operating status of each machine. The front-end provides an interface for technical staff to update machine status and schedule periodic maintenance; the back-end stores equipment information, maintenance history, and reminders when maintenance is due, ensuring equipment is always ready for production.

- Notification Management: Sends internal notifications to relevant departments when important events occur (e.g., new orders, production schedule changes, completion of a process, detection of quality defects...). The back-end is responsible for creating notifications and pushing them via WebSocket; the front-end (React) listens via WebSocket and displays notifications in real time on the user interface (e.g., pop-ups or notification icons).

- System Administration: Manages users and permissions within the system. The front-end provides a screen for administrators to create user accounts and assign permissions to employees (e.g., permissions for production managers, planning managers, customers...); the back-end handles user authentication (login), password encryption, and controls access rights for APIs corresponding to user roles.
