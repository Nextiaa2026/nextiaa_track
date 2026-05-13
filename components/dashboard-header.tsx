"use client";

import { useCurrentUser } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon, Logout01Icon, UserIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { useLogout } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/auth/AuthComponents";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const { data: user } = useCurrentUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const displayName = user?.name ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 ml-auto px-4">
      {/* Credits Display */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
        <HugeiconsIcon icon={ZapIcon} strokeWidth={2.5} size={14} className="text-emerald-500" />
        <span className="text-xs font-bold uppercase tracking-wider">
          {user?.credits ?? 0} Credits
        </span>
      </div>

      {/* Language Switcher */}
      <div className="hidden sm:block">
        <LanguageSwitcher className="relative top-0 right-0 z-auto" />
      </div>

      {/* User Avatar & Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-gray-100 bg-white">
            <Avatar className="h-full w-full rounded-full">
              <AvatarImage src={user?.image ?? ""} alt={displayName} />
              <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mt-2 rounded-[20px] p-2" align="end" forceMount>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-gray-500">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-2" />
          <DropdownMenuItem className="rounded-xl gap-2 focus:bg-gray-50">
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} size={16} />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-xl gap-2 focus:bg-gray-50">
            <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} size={16} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-2" />
          <DropdownMenuItem 
            className="rounded-xl gap-2 focus:bg-red-50 text-red-600 focus:text-red-600 cursor-pointer"
            disabled={isLoggingOut}
            onClick={() => logout()}
          >
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} size={16} />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
