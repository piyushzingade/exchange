import Image from "next/image";




export default function Slider() {
  return (
    <div className="rounded-2xl w-full h-full">
        <Image src={"/home-banner-refer.webp"} alt="logo" width={5000} height={5000} className="rounded-2xl" ></Image>
    </div>
  )
}
