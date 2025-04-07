import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { mentorGetProfile, updateMenteeYears, updateMenteeYearsReverse } from '../../../../../actions/mentor';

const MenteesByYear = () => {
    const dispatch = useDispatch();
    const { profileData } = useSelector((state) => state.mentor);

    useEffect(() => {
        dispatch(mentorGetProfile());
    }, [dispatch]);

    const handleUpdateYears = () => {
        const fourthYearCount = profileData?.menteesByYear?.fourthYear?.length || 0;
        const message = `Are you sure you want to update all mentee years? This will:\n` +
            `- Move first year mentees to second year\n` +
            `- Move second year mentees to third year\n` +
            `- Move third year mentees to fourth year\n` +
            `${fourthYearCount > 0 ? `- DELETE ${fourthYearCount} fourth year mentee${fourthYearCount > 1 ? 's' : ''} permanently\n` : ''}` +
            `\nThis action cannot be undone.`;

        if (window.confirm(message)) {
            dispatch(updateMenteeYears());
        }
    };

    const handleUpdateYearsReverse = () => {
        if (window.confirm('Are you sure you want to update all mentee years? This will move:\n- Second year mentees to first year\n- Third year mentees to second year\n- Fourth year mentees to third year')) {
            dispatch(updateMenteeYearsReverse());
        }
    };

    console.log("Complete profile data:", profileData);
    console.log("Mentees by year:", profileData?.menteesByYear);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Mentees by Year</h1>
                <div className="flex gap-4">
                    <button
                        onClick={handleUpdateYears}
                        className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-md"
                    >
                        Move Years Up
                    </button>
                    <button
                        onClick={handleUpdateYearsReverse}
                        className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-md"
                    >
                        Move Years Down
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)] overflow-y-auto">
                {Object.entries(profileData?.menteesByYear || {}).map(([year, students]) => (
                    <div key={year} className="bg-white rounded-lg shadow-md p-4">
                        <h2 className="text-xl font-semibold mb-4 capitalize">
                            {year.replace(/([A-Z])/g, " $1").trim()} Year
                        </h2>
                        <div className="space-y-2">
                            {students.map((student) => (
                                <div
                                    key={student._id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                >
                                    <span className="font-medium">
                                        {student.firstname} {student.middlename} {student.lastname}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {student.enrollment_no}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenteesByYear; 