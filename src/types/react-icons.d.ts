import { ElementType } from "react";
import { IconType } from "react-icons";

declare module "@chakra-ui/react" {
  interface IconProps {
    as?: IconType | ElementType;
  }
}
