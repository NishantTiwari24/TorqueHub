import { Navigate, Route, Routes } from 'react-router-dom'
import StaffDashboard from '../pages/staff/staff_dashboard/StaffDashboardPage'
import StaffAppointmentsPage from '../pages/staff/appointments/StaffAppointmentsPage'
import CustomerSearchPage from '../pages/staff/customer_search/CustomerSearchPage'
import CustomerDetailsPage from '../pages/staff/customer_details/CustomerDetailsPage'
import SalesInvoicePage from '../pages/staff/create_sales_invoice/SalesInvoicePage'
import SalesInvoiceListPage from '../pages/staff/sales_invoice_list/SalesInvoiceListPage'
import SalesInvoiceDetailPage from '../pages/staff/sales_invoice_detail/SalesInvoiceDetailPage'
import EmailInvoicePage from '../pages/staff/email_invoice/EmailInvoicePage'
import CustomerReportsPage from '../pages/staff/customer_reports/CustomerReportsPage'
import PartRequestsPage from '../pages/staff/part_requests/PartRequestsPage'
import StaffProfilePage from '../pages/staff/my_profile/StaffProfile'
import RegisterCustomerPage from '../pages/staff/register_customer/RegisterCustomerPage'
import AdminDashboard from '../pages/admin/Dashboard/Dashboard'
import ManageStaffPage from '../pages/admin/Manage-Staff/Manage-Staff'
import ManageVendorPage from '../pages/admin/Manage-Vendor/Manage-Vendor'
import ManagePartPage from '../pages/admin/Manage-Part/Manage-Part'
import PurchaseInvoicePage from '../pages/admin/Purchase-Invoice/Purchase-Invoice'
import PurchaseInvoiceCreatePage from '../pages/admin/Purchase-Invoice-Create/PurchaseInvoiceCreatePage'
import PurchaseInvoiceDetailPage from '../pages/admin/Purchase-Invoice-Detail/PurchaseInvoiceDetailPage'
import AdminSalesInvoiceDetailPage from '../pages/admin/Sales-Invoice-Detail/SalesInvoiceDetailPage'
import StockTransactionListPage from '../pages/admin/Stock-Transactions/StockTransactionListPage'
import AdminProfilePage from '../pages/admin/my_profile/AdminProfile'
import CustomerDashboard from '../pages/customer/customer_dashboard/CustomerDashboard'
import CustomerProfile from '../pages/customer/my_profile/CustomerProfile'
import CustomerVehiclesPage from '../pages/customer/my_vehicles/CustomerVehiclesPage'
import CustomerAppointmentsPage from '../pages/customer/my_appointments/CustomerAppointmentsPage'
import BookAppointmentPage from '../pages/customer/book_appointment/BookAppointmentPage'
import PurchaseHistoryPage from '../pages/customer/purchase_history/PurchaseHistoryPage'
import RequestPartPage from '../pages/customer/request_part/RequestPartPage'
import CustomerReviewsPage from '../pages/customer/my_reviews/CustomerReviewsPage'
import LandingPage from '../pages/public/Landing/Landing'
import AboutPage from '../pages/public/About/About'
import ContactPage from '../pages/public/Contact/Contact'
import ProductsPage from '../pages/public/ProductListing/Products'
import ProductDetailsPage from '../pages/public/ProductDetails/ProductDetails'
import LoginPage from '../pages/Auth/Login'
import RegisterPage from '../pages/Auth/Register'
import ForgotPasswordPage from '../pages/Auth/ForgotPassword'
import ResetPasswordPage from '../pages/Auth/ResetPassword'
import VerifyEmailPage from '../pages/Auth/VerifyEmail'
import NotFound from '../components/common/feedback/NotFound'
import ProtectedRoute from './ProtectedRoute'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/public" replace />} />
      <Route element={<ProtectedRoute allowedRoles={['Staff']} />}>
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/dashboard" element={<Navigate to="/staff" replace />} />
        <Route path="/staff/appointments" element={<StaffAppointmentsPage />} />
        <Route path="/staff/customer-search" element={<CustomerSearchPage />} />
        <Route path="/staff/customers/:id" element={<CustomerDetailsPage />} />
        <Route path="/customers/:id" element={<CustomerDetailsPage />} />
        <Route path="/staff/register-customer" element={<RegisterCustomerPage />} />
        <Route path="/staff/create-sales-invoice" element={<SalesInvoicePage />} />
        <Route path="/staff/email-invoice" element={<EmailInvoicePage />} />
        <Route path="/staff/sales-invoices" element={<SalesInvoiceListPage />} />
        <Route path="/staff/sales-invoices/:id" element={<SalesInvoiceDetailPage />} />
        <Route path="/staff/customer-reports" element={<CustomerReportsPage />} />
        <Route path="/staff/part-requests" element={<PartRequestsPage />} />
        <Route path="/staff/my-profile" element={<StaffProfilePage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/manage-staff" element={<ManageStaffPage />} />
        <Route path="/admin/manage-vendor" element={<ManageVendorPage />} />
        <Route path="/admin/manage-part" element={<ManagePartPage />} />
        <Route path="/admin/purchase-invoice" element={<PurchaseInvoicePage />} />
        <Route path="/admin/purchase-invoice/create" element={<PurchaseInvoiceCreatePage />} />
        <Route path="/admin/purchase-invoice/:id" element={<PurchaseInvoiceDetailPage />} />
        <Route path="/admin/sales-invoices/:id" element={<AdminSalesInvoiceDetailPage />} />
        <Route path="/admin/stock-transactions" element={<StockTransactionListPage />} />
        <Route path="/admin/my-profile" element={<AdminProfilePage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['Customer']} />}>
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/settings" element={<CustomerProfile />} />
        <Route path="/customer/my-vehicles" element={<CustomerVehiclesPage />} />
        <Route path="/customer/my-appointments" element={<CustomerAppointmentsPage />} />
        <Route path="/customer/book-appointment" element={<BookAppointmentPage />} />
        <Route path="/customer/purchase-history" element={<PurchaseHistoryPage />} />
        <Route path="/customer/request-part" element={<RequestPartPage />} />
        <Route path="/customer/my-reviews" element={<CustomerReviewsPage />} />
      </Route>
      <Route path="/public" element={<LandingPage />} />
      <Route path="/public/about" element={<AboutPage />} />
      <Route path="/public/contact" element={<ContactPage />} />
      <Route path="/public/products" element={<ProductsPage />} />
      <Route path="/public/products/:id" element={<ProductDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
