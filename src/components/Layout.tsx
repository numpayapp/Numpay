import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button, buttonVariants } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import {
  Bell,
  CreditCardIcon,
  HistoryIcon,
  HomeIcon,
  Menu,
  PlusIcon,
  SendIcon,
  SettingsIcon,
} from "lucide-react";
import React from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Logo from "./Logo";

const links = [
  {
    name: "Dashboard",
    href: "/home",
    icon: <HomeIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Activity",
    href: "/activity",
    icon: <HistoryIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Add Money",
    href: "/add-funds",
    icon: <PlusIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Send",
    href: "/send",
    icon: <SendIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Request",
    href: "/request",
    icon: <CreditCardIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: <SettingsIcon className="h-5 w-5 mr-3" />,
  },
];

const tabLinks = [
  {
    name: "Dashboard",
    href: "/home",
    icon: <HomeIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Activity",
    href: "/activity",
    icon: <HistoryIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Add Money",
    href: "/add-funds",
    icon: <PlusIcon className="h-5 w-5 mr-3" />,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: <SettingsIcon className="h-5 w-5 mr-3" />,
  },
];

export default function Layout() {
  const { isAuthenticated, user } = useAuth();

  const [openMobile, setOpenMobile] = React.useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  React.useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isAuthenticated) {
    // Store current URL so user is redirected back after login
    if (location.pathname !== '/login') {
      localStorage.setItem('redirectAfterLogin', window.location.href);
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border hidden md:flex flex-col z-10">
        <div className="p-6">
          <Link to={"/home"} className="text-center">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `${cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start hover:bg-muted",
                    isActive ? "bg-muted" : ""
                  )}`
                }
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-primary text-xs">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.name || "User"}</p>
              {user?.phone?.number && (
                <p className="text-xs text-muted-foreground">
                  {user.phone.number}
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="p-4 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="p-6 py-3 border-b border-border">
                <Link to={"/home"} className="text-center">
                  <Logo />
                </Link>
              </div>

              <nav className="p-4">
                <div className="space-y-4">
                  {links.map((link) => (
                    <NavLink
                      key={link.href}
                      to={link.href}
                      onClick={() => setOpenMobile(false)}
                      className={({ isActive }) =>
                        `${cn(
                          buttonVariants({ variant: "ghost" }),
                          "w-full justify-start hover:bg-muted",
                          isActive ? "bg-muted" : ""
                        )}`
                      }
                    >
                      {link.icon}
                      {link.name}
                    </NavLink>
                  ))}
                </div>
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-primary text-xs">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.phone?.number || "john@example.com"}
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link to={"/home"} className="text-center">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button> */}
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback className="bg-primary text-xs">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between p-6 ml-64 border-b border-border">
        <div className="">
          <p>
            {links.find((link) => location.pathname.startsWith(link.href))
              ?.name || "Dashboard"}
          </p>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          {/* <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
          </Button> */}
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-primary text-xs">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.name || "User"}</p>
              {user?.phone?.number && (
                <p className="text-xs text-muted-foreground">
                  {user.phone.number}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border md:hidden z-50">
        <Tabs
          defaultValue="home"
          className="w-full"
          onValueChange={(e) => navigate(e)}
        >
          <TabsList className="grid grid-cols-4 bg-transparent h-16">
            {tabLinks.map((link) => (
              <TabsTrigger
                key={link.href}
                value={link.href}
                className="data-[state=active]:bg-transparent text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-1">
                  {link.icon}
                  <span className="text-xs">{link.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <main className="px-4 pb-24 md:pl-64 md:pt-0 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
