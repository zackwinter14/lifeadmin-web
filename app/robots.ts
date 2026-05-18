import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/manual",
          "/bank",
          "/vault",
          "/credit",
          "/expenses",
          "/history",
          "/calendar",
          "/budget",
          "/save",
          "/income",
          "/gas",
          "/networth",
          "/household",
          "/cancel",
          "/report",
          "/wrapped",
          "/autoai",
          "/insights",
          "/rewards",
          "/profile",
          "/upcoming",
          "/api/",
          "/admin.html",
          "/verify-email",
        ],
      },
    ],
    sitemap: "https://lifeadminofficial.com/sitemap.xml",
  };
}
