import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/collection/:path*",
    "/search/:path*",
    "/scan/:path*",
    "/minifigs/:path*",
    "/parts/:path*",
    "/profile/:path*",
  ],
};
