import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/Landing/dropdown-menu";
import { ArrowDown, ChevronDown } from "lucide-react";
export default function DropDownButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex justify-center items-center gap-1 border-none outline-none cursor-pointer text-[#969faf]">
        More{" "}
        <span className="flex justify-center items-center mt-1">
          <ChevronDown className="text-sm text-[#969faf] " />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
        {/* <DropdownMenuSeparator /> */}
        <DropdownMenuItem className="hover:bg-[]">Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Team</DropdownMenuItem>
        <DropdownMenuItem>Subscription</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
