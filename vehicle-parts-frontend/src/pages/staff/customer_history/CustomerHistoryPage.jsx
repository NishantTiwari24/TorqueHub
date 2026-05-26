import StaffLayout from '../../../layout/StaffLayout'

function CustomerHistoryPage() {
  return (
    <StaffLayout mainClassName="ml-64 min-h-screen bg-background px-6 lg:px-10 pt-28 lg:pt-28 pb-24 lg:pb-10">
<div className="w-full space-y-gutter">
{/* Breadcrumbs */}
<nav className="flex items-center gap-2 text-on-surface-variant font-label-caps mb-4">
<span className="hover:text-primary cursor-pointer">CUSTOMERS</span>
<span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
<span className="text-primary">HISTORY</span>
</nav>
{/* Top: Customer Profile Card */}
<section className="bg-white rounded-xl border border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
<div className="flex items-center p-lg gap-lg">
<div className="h-24 w-24 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 border-4 border-surface">
<img alt="Customer Profile" className="w-full h-full object-cover" data-alt="Portrait of a male customer in a casual workshop environment, natural warm lighting, cinematic depth of field" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHxxiQ6fzixO4T8S8R0k4m4-XHNsEfh8vHrhQ963M9zURu9wUIpHJh8cqM9lGPATRxxOINfPN4T48ODyX-DRYkNaZsI3O4AnEO3xo7dQR8oNROkpBdirdXlHLYMXeoG6qaXEX5IhBzQAH369F29ftEmo1OUh-xINjLf6uLipvXPb5IbePeASWAFWAepX6DyNG7-8IbCxZFeQ9fPHTRaCwkmCBFDacvqvFYBIWV72QPrRE2qwzym6BYTtFzlIXCy0f6iDbavV8D0zK1"/>
</div>
<div className="flex-1">
<h1 className="text-5xl font-black tracking-tight text-on-surface mb-xs">Marcus Sterling</h1>
<div className="flex flex-wrap gap-md">
<div className="flex items-center gap-xs text-on-surface-variant">
<span className="material-symbols-outlined text-primary" data-icon="mail">mail</span>
<span className="text-body-sm font-inter">m.sterling@example.com</span>
</div>
<div className="flex items-center gap-xs text-on-surface-variant">
<span className="material-symbols-outlined text-primary" data-icon="call">call</span>
<span className="text-body-sm font-inter">+1 (555) 234-8901</span>
</div>
<div className="flex items-center gap-xs text-on-surface-variant">
<span className="material-symbols-outlined text-primary" data-icon="location_on">location_on</span>
<span className="text-body-sm font-inter">Seattle, WA</span>
</div>
</div>
</div>
<div className="flex flex-col items-end gap-sm">
<span className="px-3 py-1 bg-primary-container text-on-primary-container text-label-caps rounded-full">VIP CUSTOMER</span>
<p className="text-body-sm text-on-surface-variant italic">Member since Jan 2021</p>
</div>
</div>
<div className="bg-surface-container-low px-lg py-sm flex justify-between items-center border-t border-outline-variant">
<div className="flex gap-lg">
<div className="flex flex-col">
<span className="text-label-caps text-on-surface-variant">TOTAL SPEND</span>
<span className="text-body-base font-bold text-on-surface">Rs. 14,230.50</span>
</div>
<div className="flex flex-col border-l border-outline-variant pl-lg">
<span className="text-label-caps text-on-surface-variant">OPEN ORDERS</span>
<span className="text-body-base font-bold text-on-surface">2</span>
</div>
</div>
<button className="flex items-center gap-2 bg-secondary text-on-secondary px-lg py-2 rounded-lg text-button hover:bg-secondary-container transition-colors">
<span className="material-symbols-outlined text-sm" data-icon="edit">edit</span>
                        Edit Profile
                    </button>
</div>
</section>
{/* Middle: Split Layout */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
{/* Left: Past Purchases Table (7/12) */}
<div className="lg:col-span-7 space-y-md">
<div className="flex items-center justify-between">
<h3 className="text-h3 font-h3 text-on-surface">Past Purchases</h3>
<div className="flex gap-sm">
<button className="p-2 bg-white border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined" data-icon="filter_list">filter_list</span>
</button>
<button className="p-2 bg-white border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined" data-icon="download">download</span>
</button>
</div>
</div>
<div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low border-b border-outline-variant">
<th className="px-md py-lg text-label-caps text-on-surface-variant">Date</th>
<th className="px-md py-lg text-label-caps text-on-surface-variant">Invoice #</th>
<th className="px-md py-lg text-label-caps text-on-surface-variant">Total</th>
<th className="px-md py-lg text-label-caps text-on-surface-variant">Status</th>
<th className="px-md py-lg"></th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant">
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-md py-md text-body-sm font-inter">Oct 24, 2023</td>
<td className="px-md py-md text-body-sm font-inter font-bold">INV-90234</td>
<td className="px-md py-md text-body-sm font-inter font-bold text-on-surface">Rs. 1,240.00</td>
<td className="px-md py-md">
<span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded uppercase tracking-wider">Paid</span>
</td>
<td className="px-md py-md text-right">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer group-hover:text-primary" data-icon="visibility">visibility</span>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-md py-md text-body-sm font-inter">Sep 12, 2023</td>
<td className="px-md py-md text-body-sm font-inter font-bold">INV-89120</td>
<td className="px-md py-md text-body-sm font-inter font-bold text-on-surface">Rs. 450.25</td>
<td className="px-md py-md">
<span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded uppercase tracking-wider">Paid</span>
</td>
<td className="px-md py-md text-right">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer group-hover:text-primary" data-icon="visibility">visibility</span>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-md py-md text-body-sm font-inter">Aug 05, 2023</td>
<td className="px-md py-md text-body-sm font-inter font-bold">INV-88044</td>
<td className="px-md py-md text-body-sm font-inter font-bold text-on-surface">Rs. 2,890.00</td>
<td className="px-md py-md">
<span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded uppercase tracking-wider">Paid</span>
</td>
<td className="px-md py-md text-right">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer group-hover:text-primary" data-icon="visibility">visibility</span>
</td>
</tr>
<tr className="hover:bg-primary/5 transition-colors group">
<td className="px-md py-md text-body-sm font-inter">Jul 19, 2023</td>
<td className="px-md py-md text-body-sm font-inter font-bold">INV-87551</td>
<td className="px-md py-md text-body-sm font-inter font-bold text-on-surface">Rs. 120.00</td>
<td className="px-md py-md">
<span className="px-2 py-0.5 bg-error-container text-error text-[10px] font-bold rounded uppercase tracking-wider">Refunded</span>
</td>
<td className="px-md py-md text-right">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer group-hover:text-primary" data-icon="visibility">visibility</span>
</td>
</tr>
</tbody>
</table>
<div className="px-lg py-md border-t border-outline-variant bg-surface-container-low text-center">
<button className="text-button text-primary hover:underline">View All 18 Transactions</button>
</div>
</div>
</div>
{/* Right: Vehicle Info & Service History (5/12) */}
<div className="lg:col-span-5 space-y-gutter">
{/* Vehicle Information Card */}
<div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg">
<div className="flex items-center justify-between mb-lg">
<h3 className="text-h3 font-h3 text-on-surface">Vehicle Information</h3>
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer" data-icon="settings">settings</span>
</div>
<div className="relative rounded-lg overflow-hidden h-32 mb-lg">
<img alt="Customer Vehicle" className="w-full h-full object-cover" data-alt="Modern dark gray performance luxury sedan in a professional studio setting, sleek highlights, high-tech automotive aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaeLW_zrTitkTDyBV5f5TXXwmLnGKVBm2UwXR350s-khuZurnFCVMa58PNYovVgLTvjd7aDcItHMOstFXvR7QgI5-3uY0hKpjbfwGsEez3UCjh5bbX82FjYPfMfqCVuEwaRF-Mk9un7eV6Wtc93k2kzpQFrZlQSruDucMns6bsZ9fbtcomb98sIl7aJju-_IkgF6V8enNLcdXGMcZAuEEyRzepu5i2TxxBqrQcJDe-noZWzeTv_RkfZNI_4gBYbF8bJGB3KxGWTjUa"/>
<div className="absolute bottom-2 right-2 bg-on-surface text-white px-2 py-1 text-[10px] font-bold rounded">PRIMARY</div>
</div>
<div className="space-y-sm">
<div className="flex justify-between items-center py-2 border-b border-surface-container-highest">
<span className="text-body-sm text-on-surface-variant">Make/Model</span>
<span className="text-body-sm font-bold text-on-surface">BMW M4 Competition</span>
</div>
<div className="flex justify-between items-center py-2 border-b border-surface-container-highest">
<span className="text-body-sm text-on-surface-variant">Year</span>
<span className="text-body-sm font-bold text-on-surface">2022</span>
</div>
<div className="flex justify-between items-center py-2 border-b border-surface-container-highest">
<span className="text-body-sm text-on-surface-variant">VIN</span>
<span className="text-body-sm font-bold font-mono text-on-surface">WBS31AY0X83...</span>
</div>
<div className="flex justify-between items-center py-2">
<span className="text-body-sm text-on-surface-variant">Last Mileage</span>
<span className="text-body-sm font-bold text-on-surface">12,450 mi</span>
</div>
</div>
</div>
{/* Service History Timeline */}
<div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg">
<h3 className="text-h3 font-h3 text-on-surface mb-lg">Service History</h3>
<div className="space-y-lg relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-highest">
{/* Timeline Item 1 */}
<div className="relative pl-8">
<div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-container border-4 border-white flex items-center justify-center"></div>
<p className="text-label-caps text-primary mb-1">NOV 02, 2023</p>
<h4 className="text-body-base font-bold text-on-surface">Performance Brake Upgrade</h4>
<p className="text-body-sm text-on-surface-variant">Installation of Brembo ceramic rotors and pads.</p>
</div>
{/* Timeline Item 2 */}
<div className="relative pl-8">
<div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container-highest border-4 border-white flex items-center justify-center"></div>
<p className="text-label-caps text-on-surface-variant mb-1">AUG 15, 2023</p>
<h4 className="text-body-base font-bold text-on-surface">Annual Inspection &amp; Oil</h4>
<p className="text-body-sm text-on-surface-variant">Standard maintenance cycle, synthetic oil change.</p>
</div>
{/* Timeline Item 3 */}
<div className="relative pl-8">
<div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container-highest border-4 border-white flex items-center justify-center"></div>
<p className="text-label-caps text-on-surface-variant mb-1">MAR 22, 2023</p>
<h4 className="text-body-base font-bold text-on-surface">Tire Rotation &amp; Balance</h4>
<p className="text-body-sm text-on-surface-variant">Full rotation and alignment check performed.</p>
</div>
</div>
</div>
</div>
</div>
{/* Bottom: Large Credit Balance Indicator */}
<section className="bg-gradient-to-r from-on-surface to-slate-800 rounded-xl p-xl shadow-xl flex flex-col md:flex-row items-center justify-between text-white border border-slate-700">
<div className="mb-md md:mb-0">
<div className="flex items-center gap-sm mb-xs">
<span className="material-symbols-outlined text-teal-400" data-icon="account_balance_wallet">account_balance_wallet</span>
<h2 className="text-h2 font-h2 uppercase tracking-wide">Credit Balance</h2>
</div>
<p className="text-slate-400 text-body-base max-w-md">Store credits can be applied to any upcoming service or part purchase. Transfers are not permitted.</p>
</div>
<div className="text-center md:text-right">
<span className="text-[4rem] font-black leading-none block mb-sm text-teal-400">Rs. 0.00</span>
<div className="flex gap-sm justify-center md:justify-end">
<button className="bg-white/10 hover:bg-white/20 px-lg py-2 rounded-lg text-button backdrop-blur-sm transition-all border border-white/20">
                            Add Credit
                        </button>
<button className="bg-teal-500 text-slate-900 px-lg py-2 rounded-lg text-button font-bold hover:bg-teal-400 transition-all">
                            Apply to Invoice
                        </button>
</div>
</div>
</section>
</div>
    </StaffLayout>
  )
}

export default CustomerHistoryPage

