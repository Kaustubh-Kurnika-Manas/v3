import MenteesByYear from '../components/dashboard/mentorDashboard/dashboardLinks/menteesByYear/MenteesByYear';

const mentorDashboardRoutes = [
    {
        path: "/mentor/mentees-by-year",
        element: <MenteesByYear />,
        icon: <UserGroupIcon alt={false} myStyle={"h-5 w-5"} />,
        name: "Mentees by Year"
    },
];

export default mentorDashboardRoutes; 