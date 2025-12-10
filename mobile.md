Please review both of my workspaces:

- The first workspace (**Salozy Mobile**) is for **React Native mobile application development**.
- The second workspace (**Salozy Web**) contains the **web application**, which is already fully functional.

I am now starting to build the mobile application. My goal is to make the entire **Vendor role functionality** work first.  
After completing the Vendor module, I will continue role-by-role (Staff, Customer, Admin, Branch User), based on their access levels.  
Each role will have a separate page structure and design, so we should maintain separate **atoms folders** and follow a **role-based folder structure**.

Below are the **Vendor routes** from the web application that must also work in the mobile application.  
I will add REST APIs in the web project only if required — otherwise, I will use the existing APIs.  
Before creating any new API, I will first verify if an existing API is already available.

### **Vendor Module Routes for Mobile App**

1. **Login** – `auth/login`  
   - Likely already implemented in mobile app; needs rechecking.
2. **Register** – `auth/register-vendor`
3. **Forgot Password** – `auth/forgot-password`
4. **Vendor Dashboard** – `vendor/dashboard`  
   - May already be implemented; needs rechecking.
5. **Appointment Listing** – `vendor/appointments`  
   - Possibly implemented; verify functionality.
6. **My Appointments** – `/own-appoinment`
7. **Seats Management** – `/vendor/seats`
8. **Service Management** – `/vendor/services`
9. **Staff Management** – `/vendor/staff`
10. **Customers Management** – `/vendor/manage-customer`
11. **Plan Management** – `/vendor/plans`
12. **Purchased Plans** – `/vendor/purchased-plan`
13. **My Subscriptions** – `/vendor/subscriptions`
14. **Manage Branches** – `/vendor/branches`
15. **Manage Coupons** – `/vendor/coupons`
16. **Profile Update**
17. **Change Password**

These features should be gradually implemented in the mobile application following the structure and functionality already present in the web app.
desgin reference from web application but if you can better recommandation layout as per mobile view than do your best
