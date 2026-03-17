import Link from "next/link";

export function Footer() {
  return (
    <div className="w-full bg-[#FAFAFA] pb-12 px-4 md:px-8">
      {/* FLOATING BLACK CONTAINER */}
      <footer className="max-w-[1300px] mx-auto bg-black text-white rounded-[32px] overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 px-8 md:px-16 pt-20 pb-16">
          
          {/* LEFT COLUMN: Brand & Newsletter */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            
            {/* BRAND LOGO */}
            <div className="flex items-center gap-3 w-fit mb-24 md:mb-32">
               {/* Custom SVG Logo matching mockup */}
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12H18C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6V2Z" fill="currentColor"/>
                  <rect x="5" y="5" width="4" height="4" fill="currentColor" />
                  <rect x="5" y="15" width="4" height="4" fill="currentColor" />
               </svg>
               <span className="font-mono text-[20px] font-bold tracking-widest leading-[1]">FLUXBERRY AI<sup className="text-[10px]">®</sup></span>
            </div>

            {/* NEWSLETTER */}
            <div className="max-w-[480px]">
               <h3 className="font-mono text-[16px] md:text-[18px] tracking-widest uppercase mb-4 text-[#ddd]">
                 STAY IN THE LOOP.
               </h3>
               <p className="text-[#888] font-sans text-[14px] leading-relaxed mb-6">
                 Get product updates, new features, and practical insights<br className="hidden md:block"/>
                 about hiring — delivered occasionally, never spam.
               </p>

               <div className="flex items-center bg-white rounded-full p-1.5 focus-within:ring-2 focus-within:ring-white/20 transition-all shadow-inner">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 bg-transparent px-6 py-2 outline-none text-black font-sans text-[15px] placeholder:text-[#888]"
                  />
                  <button className="bg-[#f64124] hover:bg-[#e2361a] text-white font-mono text-[12px] md:text-[13px] font-medium tracking-widest px-8 md:px-10 py-3.5 rounded-full transition-colors uppercase">
                    SUBSCRIBE
                  </button>
               </div>
            </div>

          </div>

          {/* RIGHT COLUMNS: Navigation Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-8 justify-items-start lg:justify-items-end">
             
             {/* COMPANY COL */}
             <div className="flex flex-col gap-6 w-full lg:w-fit">
               <h4 className="font-mono text-[10px] text-[#555] tracking-widest uppercase mb-2">COMPANY</h4>
               <ul className="flex flex-col gap-5 text-[15px] font-sans text-[#ddd]">
                 <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                 <li><Link href="#" className="hover:text-white transition-colors">Product</Link></li>
                 <li><Link href="#" className="hover:text-white transition-colors">Solutions</Link></li>
                 <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
               </ul>
             </div>

             {/* RESOURCES COL */}
             <div className="flex flex-col gap-6 w-full lg:w-fit">
               <h4 className="font-mono text-[10px] text-[#555] tracking-widest uppercase mb-2">RESOURCES</h4>
               <ul className="flex flex-col gap-5 text-[15px] font-sans text-[#ddd]">
                 <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                 <li><Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link></li>
                 <li><Link href="#blog" className="hover:text-white transition-colors">Blogs</Link></li>
                 <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
               </ul>
             </div>

             {/* CONNECT COL */}
             <div className="flex flex-col gap-6 w-full lg:w-fit">
               <h4 className="font-mono text-[10px] text-[#555] tracking-widest uppercase mb-2">CONNECT</h4>
               <ul className="flex flex-col gap-5 text-[15px] font-sans text-[#ddd]">
                 <li><Link href="#" className="hover:text-white transition-colors">LinkedIn</Link></li>
                 <li><Link href="#" className="hover:text-white transition-colors">YouTube</Link></li>
                 <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
                 <li><Link href="#" className="hover:text-white transition-colors">X</Link></li>
               </ul>
             </div>

          </div>

        </div>

        {/* BOTTOM LEGAL BAR */}
        <div className="mx-8 md:mx-16 border-t border-dashed border-[#333] py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div className="font-mono text-[10px] md:text-[11px] text-[#666] tracking-widest uppercase">
             © {new Date().getFullYear()} FLUXBERRY AI. ALL RIGHTS RESERVED.
           </div>
           
           <div className="flex flex-wrap items-center gap-6 md:gap-10 font-mono text-[10px] md:text-[11px] text-[#666] tracking-widest uppercase">
             <Link href="#" className="hover:text-[#aaa] transition-colors">TERMS OF SERVICE</Link>
             <Link href="#" className="hover:text-[#aaa] transition-colors">PRIVACY POLICY</Link>
             <Link href="#" className="hover:text-[#aaa] transition-colors">COOKIES POLICY</Link>
           </div>
        </div>

      </footer>
    </div>
  );
}
