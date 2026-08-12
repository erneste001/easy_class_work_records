import { useState } from 'react';
import './Bounce.css';
import './Welcoming.css';
import {
    User,
    GraduationCap,
    Bell,
    Moon,
    Filter,
    BookOpen,
    Share2,
    FilePen,
    Users,
    HelpCircle,
    LogOut,
    Settings,
    TrendingUp,
    ClipboardList,
} from 'lucide-react';

function Welcoming(){
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return(
        <>
        <div className="w-full min-h-screen flex flex-col md:w-[100vw] md:h-[100vh] md:grid md:grid-cols-20 md:grid-rows-20 gap-2">

            <div className="md:col-[1/5] md:row-[1/4] shadow-md flex justify-center items-center py-3 md:py-0 order-1">
                <h3 className="rwanda-gradient-text text-sm md:text-base">
                    <span style={{ '--i': 1 }}>E</span>
                    <span style={{ '--i': 2 }}>a</span>
                    <span style={{ '--i': 3 }}>s</span>
                    <span style={{ '--i': 4 }}>y</span>
                    <span style={{ '--i': 5 }}>v</span>
                    <span style={{ '--i': 6 }}>&nbsp;</span>
                    <span style={{ '--i': 7 }}>C</span>
                    <span style={{ '--i': 8 }}>l</span>
                    <span style={{ '--i': 9 }}>a</span>
                    <span style={{ '--i': 10 }}>s</span>
                    <span style={{ '--i': 11 }}>s</span>
                    <span style={{ '--i': 12 }}>&nbsp;</span>
                    <span style={{ '--i': 13 }}>R</span>
                    <span style={{ '--i': 14 }}>e</span>
                    <span style={{ '--i': 15 }}>c</span>
                    <span style={{ '--i': 16 }}>o</span>
                    <span style={{ '--i': 17 }}>r</span>
                    <span style={{ '--i': 18 }}>d</span>
                    <span style={{ '--i': 19 }}>s</span>
                    <span style={{ '--i': 20 }}>&nbsp;</span>
                    <span style={{ '--i': 21 }}>S</span>
                    <span style={{ '--i': 22 }}>y</span>
                    <span style={{ '--i': 23 }}>s</span>
                    <span style={{ '--i': 24 }}>t</span>
                    <span style={{ '--i': 25 }}>e</span>
                    <span style={{ '--i': 26 }}>m</span>
                </h3>
            </div>

            <div className="md:col-[5/17] md:row-[1/4] shadow-md flex justify-between items-center px-3 md:px-6 py-3 md:py-0 order-2">
                <div className="flex items-center gap-2 md:gap-4">
                    <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-[rgb(32,72,131)]" />
                    <h3 className="font-medium text-sm md:text-base">Automated Class Work System</h3>
                </div>

                <div className="hidden md:flex items-center gap-4 whitespace-nowrap">
                    <div className='text-[14px] text-[rgb(48, 50, 161)]'>2000-2026</div>
                    <div className="flex items-center gap-2 ml-[2rem] w-[100%] ">
                        <Filter className="w-5 h-5 text-slate-500" />
                        <p className='text-[13px]'>Class Name</p>
                    </div>
                </div>
            </div>

            <div className="md:col-[17/21] md:row-[1/4] shadow-md gap-4 flex justify-center items-center py-3 md:py-0 order-3">

                <div className="flex items-center gap-3 md:gap-4">

                {/* Hamburger - only shows on small screens, controls sidebar drawer */}
                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2.5 rounded-[5px] bg-slate-100 dark:bg-slate-800 flex flex-col justify-center items-center gap-[3px]"
                >
                    <span className="w-5 h-[2px] bg-current"></span>
                    <span className="w-5 h-[2px] bg-current"></span>
                    <span className="w-5 h-[2px] bg-current"></span>
                </button>

                <button type="button" className="p-2.5 rounded-[5px] bg-slate-100 dark:bg-slate-800">
                    <Moon className="w-5 h-5" />
                </button>

                <div className="relative p-2.5 rounded-xl">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-100 text-green-500 text-[11px] font-bold rounded-[5px] flex items-center justify-center">0</span>
                </div>

                <div className="w-9 h-9 md:w-11 md:h-11 rounded-full md:ml-[2rem] bg-slate-100 flex items-center justify-center">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-slate-500" />
                </div>
                </div>

            </div>

            {/* Overlay backdrop for mobile drawer */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/40 z-40"
                ></div>
            )}

            {/* Sidebar - fixed drawer on mobile, static grid column on desktop (untouched) */}
            <div
                className={`md:col-[1/5] md:row-[4/21] shadow-md p-[4%] flex flex-col bg-white z-50 transition-transform duration-300 ease-in-out
                fixed top-0 left-0 h-full w-[75%] max-w-[280px]
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static md:h-auto md:w-auto md:max-w-none order-5 md:order-none`}
            >

  <div className="mb-[6%] flex items-center justify-between md:block">
    <div>
        <h2 className="text-[16px] font-semibold flex items-center justify-center md:justify-center">Easy find out</h2>
        <p className="text-[11px] text-gray-400">Manage your learning space</p>
    </div>
    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-xl px-2">&times;</button>
  </div>

  <ul className="flex flex-col gap-[2%] flex-1">

    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-[8%] p-[3%] rounded-[10px] hover:bg-blue-50 transition">
      <BookOpen className="w-[16px] h-[16px]" />
      <span className="text-[13px]">Notes</span>
      <span className="bg-blue-50 text-blue-600 rounded-[3px] px-[8px] py-[2px] text-[11px]">00</span>
    </li>

    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-[8%] p-[3%] rounded-[10px] hover:bg-blue-50 transition">
      <HelpCircle className="w-[16px] h-[16px]" />
      <span className="text-[13px]">Quizzes</span>
      <span className="bg-blue-50 text-blue-600 rounded-[3px] px-[8px] py-[2px] text-[11px]">00</span>
    </li>

    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-[8%] p-[3%] rounded-[10px] hover:bg-blue-50 transition">
      <User className="w-[16px] h-[16px]" />
      <span className="text-[13px]">Students</span>
      <span className="bg-blue-50 text-blue-600 rounded-[3px] px-[8px] py-[2px] text-[11px]">00</span>
    </li>

    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-[8%] p-[3%] rounded-[10px] hover:bg-blue-50 transition">
      <TrendingUp className="w-[16px] h-[16px]" />
      <span className="text-[13px]">Progress</span>
      <span className="bg-blue-50 text-blue-600 rounded-[3px] px-[8px] py-[2px] text-[11px]">00</span>
    </li>

    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-[8%] p-[3%] rounded-[10px] hover:bg-green-50 transition">
      <span className="w-[14px] h-[14px] bg-red-500 rounded-full"></span>
      <span className="text-[13px]">Live Activity</span>
      <span className="bg-green-50 text-green-600 rounded-[3px] px-[8px] py-[2px] text-[11px]">LIVE</span>
    </li>

    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-[8%] p-[3%] rounded-[10px] hover:bg-blue-50 transition">
      <ClipboardList className="w-[16px] h-[16px]" />
      <span className="text-[13px]">All Records</span>
      <span className="bg-blue-50 text-blue-600 rounded-[3px] px-[8px] py-[2px] text-[11px]">00</span>
    </li>

    <li className="grid grid-cols-[22px_1fr] items-center gap-[8%] p-[3%] rounded-[10px] hover:bg-blue-50 transition">
      <Settings className="w-[16px] h-[16px]" />
      <span className="text-[13px]">Settings</span>
    </li>

  </ul>

  <button className="grid grid-cols-[22px_1fr] items-center gap-[8%] mt-[6%] p-[3%] rounded-[10px] hover:bg-blue-50 transition">
    <LogOut className="w-[16px] h-[16px]" />
    <span className="text-[13px]">Sign Out</span>
  </button>

</div>

            {/* Main content - stacks as one column on mobile, original 5-col grid from md up */}
            <div className="md:col-[5/21] md:row-[4/21] shadow-md flex flex-col md:grid md:grid-cols-5 md:grid-rows-20 gap-4 w-full md:h-[100%] p-4 md:p-[1rem] order-4">

                <div className="md:col-[1/6] md:row-[1/5] shadow-md ">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between p-1">
                    <div className='sm:ml-5 text-center sm:text-left'>
                        <p className='text-[#10B981] font-bold'>Notes Dashboard</p>
                        <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>create, manage and share study materials with your students</p>
                    </div>
                    <div className='sm:mr-4 w-full sm:w-auto'>
                        <button className='w-full sm:w-auto pl-4 pr-4 pt-2 pb-2 rounded-[2px] text-white bg-[rgb(32,72,131)] '>
                            <i className="fas fa-plus"></i> new notes
                        </button>
                    </div>
                </div>
                </div>

                <div className="md:col-[1/6] md:row-[4/8] grid grid-cols-2 md:grid-cols-5 gap-2 p-2 md:grid-rows-2 shadow-md ">
                    <div className='md:col-[1/2] md:row-[1/3] shadow-lg flex justify-between items-center p-4 md:p-7'>
                        <div>
                            <BookOpen className='w-[20px] h-[20px]' />
                        </div>
                        <div>
                            <p className='text-[15px] text-[rgb(22,111,28)] font-bold relative bg-[#f0f0f0] w-[100%] flex justify-center items-center rounded-[5px]'>0</p>
                            <p className='text-[12px]'>T_notes</p>
                        </div>
                    </div>
                    <div className='md:col-[2/3] md:row-[1/3] shadow-lg flex items-center justify-between p-4 md:p-7'>
                        <div>
                            <FilePen className='w-[20px] h-[20px]' />
                        </div>
                        <div>
                            <p className='text-[15px] text-[rgb(22,111,28)] font-bold relative bg-[#f0f0f0] w-[100%] flex justify-center items-center rounded-[5px]'>0</p>
                            <p className='text-[12px]'>draft</p>
                        </div>
                    </div>
                    <div className='md:col-[3/4] md:row-[1/3] shadow-lg flex justify-between items-center p-4 md:p-7'>
                        <div>
                            <Share2 className='w-[20px] h-[20px]' />
                        </div>
                        <div>
                            <p className='text-[15px] font-bold relative bg-[#f0f0f0] text-[rgb(22,111,28)] w-[100%] flex justify-center items-center rounded-[5px]'>0</p>
                            <p className='text-[12px]'>shared</p>
                        </div>
                    </div>
                    <div className='md:col-[4/5] md:row-[1/3] shadow-lg flex justify-between items-center p-4 md:p-7'>
                        <div>
                            <Users className='w-[20px] h-[20px]' />
                        </div>
                        <div>
                            <p className='text-[15px] font-bold relative text-[rgb(22,111,28)] bg-[#f0f0f0] w-[100%] flex justify-center items-center rounded-[5px]'>0</p>
                            <p className='text-[12px]'>students</p>
                        </div>
                    </div>
                    
                </div>

                <div className="md:col-[1/3] md:row-[8/11] shadow-md ">
                    <div className='flex items-center list-none gap-2 md:gap-4 p-4 w-[100%] overflow-x-auto'>
                        <li className='rounded-[3px] w-[30%] min-w-[80px] p-4 flex items-center justify-center text-[13px] bg-[#f0f0f0] relative shrink-0'>all
                            <button className='w-[30px] h-[30px] bg-[rgb(32,72,131)] absolute top-[0px] left-[-2px] rounded-[4px] text-[13px] flex justify-center items-center text-[rgb(250,210,11)] '>0</button>
                        </li>
                        <li className='rounded-[3px] w-[30%] min-w-[80px] p-4 flex items-center justify-center bg-[#f0f0f0] relative text-[13px] shrink-0'>shared
                            <button className='w-[30px] h-[30px] bg-[rgb(32,72,131)] absolute top-[0px] left-[-2px] rounded-[4px] text-[13px] flex justify-center items-center text-[rgb(250,210,1)] '>0</button>
                        </li>
                        <li className='rounded-[3px] w-[30%] min-w-[80px] p-4 flex items-center justify-center bg-[#f0f0f0] relative text-[13px] shrink-0'>draft
                            <button className='w-[30px] h-[30px] bg-[rgb(32,72,131)] absolute top-[0px] text-[13px] left-[-2px] flex justify-center items-center rounded-[4px] text-[rgb(250,210,1)] '>2</button>
                        </li>
                      
                    </div>
                </div>

                <div className="md:col-[1/6] md:row-[10/21] shadow-md rounded-xl bg-white flex items-center justify-center py-8 md:py-0">
                <div className="animating">
                    <BookOpen
                    className="books w-10 h-10 mx-auto text-slate-400"
                    />

                    <h3 className="text-base flex justify-center font-semibold text-black">
                    No notes yet
                    </h3>

                    <p className="text-sm ml-[10%] text-gray-400 mt-1 max-w-xs mx-auto">
                    Notes and updates will appear here once they are added.
                    </p>
                </div>
                </div>

            </div>

        </div>
        </>
    );
}
export default Welcoming;