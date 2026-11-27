import nova from "../assets/avatars/nova.png";
import pixel from "../assets/avatars/pixel.png";
import orbita from "../assets/avatars/orbita.png";
import chispa from "../assets/avatars/chispa.png";
import bosque from "../assets/avatars/bosque.png";
import marea from "../assets/avatars/marea.png";
import zorro from "../assets/avatars/zorro.webp";
import ajolote from "../assets/avatars/ajolote.webp";
import buho from "../assets/avatars/buho.webp";
import carpincho from "../assets/avatars/carpincho.webp";
import rover from "../assets/avatars/rover.webp";
import prisma from "../assets/avatars/prisma.webp";
import buzo from "../assets/avatars/buzo.webp";
import antena from "../assets/avatars/antena.webp";
import cartografa from "../assets/avatars/cartografa.webp";
import ritmo from "../assets/avatars/ritmo.webp";
import cobalto from "../assets/avatars/cobalto.webp";
import alquimista from "../assets/avatars/alquimista.webp";

export const profileAvatarCollections = [
  { id: "classics", title: "Clásicos de Academix", items: [
    { id: "nova", name: "Nova", image: nova },
    { id: "pixel", name: "Píxel", image: pixel },
    { id: "orbita", name: "Órbita", image: orbita },
    { id: "chispa", name: "Chispa", image: chispa },
    { id: "bosque", name: "Bosque", image: bosque },
    { id: "marea", name: "Marea", image: marea },
  ] },
  { id: "wildlife", title: "Fauna fantástica", items: [
    { id: "zorro", name: "Canelo", image: zorro },
    { id: "ajolote", name: "Bruma", image: ajolote },
    { id: "buho", name: "Ámbar", image: buho },
    { id: "carpincho", name: "Moka", image: carpincho },
  ] },
  { id: "lab", title: "Laboratorio", items: [
    { id: "rover", name: "Rover", image: rover },
    { id: "prisma", name: "Prisma", image: prisma },
    { id: "buzo", name: "Nautilus", image: buzo },
    { id: "antena", name: "Bita", image: antena },
  ] },
  { id: "explorers", title: "Exploradores", items: [
    { id: "cartografa", name: "Vega", image: cartografa },
    { id: "ritmo", name: "Ritmo", image: ritmo },
    { id: "cobalto", name: "Cobalto", image: cobalto },
    { id: "alquimista", name: "Lila", image: alquimista },
  ] },
];

export const profileAvatars = profileAvatarCollections.flatMap(({ items }) => items);
