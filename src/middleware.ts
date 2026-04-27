import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAdminRoute = pathname.startsWith("/admin");
    const isStaffRoute = pathname.startsWith("/staff");
    const isOperatorRoute = pathname.startsWith("/operator");
    const isProtectedRoute = isAdminRoute || isStaffRoute || isOperatorRoute;

    if (!user && isProtectedRoute) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

        const role = profile?.role;
        const platformRole = profile?.platform_role;

        if (isAdminRoute && role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname =
                platformRole === "platform_operator"
                    ? "/operator/dashboard"
                    : role === "staff"
                      ? "/staff/dashboard"
                      : "/login";
            return NextResponse.redirect(url);
        }

        if (isStaffRoute && role !== "staff" && role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = platformRole === "platform_operator" ? "/operator/dashboard" : "/login";
            return NextResponse.redirect(url);
        }

        if (isOperatorRoute && platformRole !== "platform_operator") {
            const url = request.nextUrl.clone();
            url.pathname = role === "admin" ? "/admin/dashboard" : role === "staff" ? "/staff/dashboard" : "/login";
            return NextResponse.redirect(url);
        }

    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
