import { UserRoute } from "../components/ProtectedRoute";

// The splash screen requires authentication since it checks user setup status
// and redirects to user-specific pages
const layouts = [UserRoute];
export default layouts;