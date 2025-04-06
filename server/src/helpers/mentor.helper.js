const Mentor = require("../models/Mentor");
const Student = require("../models/Student");
const adminController = require("../controllers/admin.controller");
const axios = require("axios");
const Admin = require("../models/Admin");
const response = require("../utils/responses.utils");

// MinHeap class for mentor pairs
class MinHeap {
    constructor() {
        this.heap = [];
    }

    // Helper methods for heap operations
    getParentIndex(index) {
        return Math.floor((index - 1) / 2);
    }

    getLeftChildIndex(index) {
        return 2 * index + 1;
    }

    getRightChildIndex(index) {
        return 2 * index + 2;
    }

    hasParent(index) {
        return this.getParentIndex(index) >= 0;
    }

    hasLeftChild(index) {
        return this.getLeftChildIndex(index) < this.heap.length;
    }

    hasRightChild(index) {
        return this.getRightChildIndex(index) < this.heap.length;
    }

    parent(index) {
        return this.heap[this.getParentIndex(index)];
    }

    leftChild(index) {
        return this.heap[this.getLeftChildIndex(index)];
    }

    rightChild(index) {
        return this.heap[this.getRightChildIndex(index)];
    }

    swap(index1, index2) {
        const temp = this.heap[index1];
        this.heap[index1] = this.heap[index2];
        this.heap[index2] = temp;
    }

    // Add a mentor pair to the heap
    add(pair) {
        this.heap.push(pair);
        this.heapifyUp();
    }

    // Remove and return the pair with minimum workload
    poll() {
        if (this.heap.length === 0) return null;
        const item = this.heap[0];
        this.heap[0] = this.heap[this.heap.length - 1];
        this.heap.pop();
        this.heapifyDown();
        return item;
    }

    // Get the pair with minimum workload without removing it
    peek() {
        return this.heap[0];
    }

    // Move a pair up the heap if it has less workload than its parent
    heapifyUp() {
        let index = this.heap.length - 1;
        while (this.hasParent(index) && 
               this.parent(index).totalWorkload > this.heap[index].totalWorkload) {
            this.swap(this.getParentIndex(index), index);
            index = this.getParentIndex(index);
        }
    }

    // Move a pair down the heap if it has more workload than its children
    heapifyDown() {
        let index = 0;
        while (this.hasLeftChild(index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);
            if (this.hasRightChild(index) && 
                this.rightChild(index).totalWorkload < this.leftChild(index).totalWorkload) {
                smallerChildIndex = this.getRightChildIndex(index);
            }

            if (this.heap[index].totalWorkload < this.heap[smallerChildIndex].totalWorkload) {
                break;
            }

            this.swap(index, smallerChildIndex);
            index = smallerChildIndex;
        }
    }

    // Update the workload of a pair and maintain heap property
    updateWorkload(pairIndex, newWorkload) {
        this.heap[pairIndex].totalWorkload = newWorkload;
        this.heapifyUp();
        this.heapifyDown();
    }

    // Get the current size of the heap
    size() {
        return this.heap.length;
    }
}

/**
 *  This module consists of methods which will be called inside other methods to do some simple specific tasks
 *  They acts as a helper to other functions in performing some specific tasks.
 *
 *  *** This module consists all the helper function for Mentor
 */

module.exports = {
    // this method fetch all the mentors from the db and returns it
    /**
     * @Desc This function fetches all the available mentors
     * @returns Array of Mentors
     */
    getAllMentors: async () => {
        const mentors = await Mentor.find();
        return mentors;
    },

    /**
     * Automatically pairs mentors and assigns mentees using a min-heap based approach
     * Algorithm:
     * 1. Create mentor pairs (senior + junior)
     * 2. Maintain pairs in a min-heap based on total workload
     * 3. Assign new mentees to the pair with least workload
     * 4. Update heap after each assignment
     */
    autoPairMentorsAndAssignMentees: async () => {
        try {
            // Get all mentors and students
            const mentors = await Mentor.find({});
            const allStudents = await Student.find({});
            console.log(`Found ${mentors.length} mentors and ${allStudents.length} total students`);

            if (mentors.length === 0 || allStudents.length === 0) {
                return {
                    success: false,
                    message: "No mentors or students found in the database"
                };
            }

            // Filter out students that already have mentors
            const unassignedStudents = allStudents.filter(student => 
                !student.mentoredBy || student.mentoredBy.length === 0
            );
            console.log(`Found ${unassignedStudents.length} unassigned students`);

            if (unassignedStudents.length === 0) {
                return {
                    success: true,
                    message: "All students already have mentors assigned"
                };
            }

            // Get current mentee counts for each mentor
            const mentorWorkloads = {};
            for (const mentor of mentors) {
                mentorWorkloads[mentor._id] = await Student.countDocuments({ mentoredBy: mentor._id });
                console.log(`Mentor ${mentor._id} currently has ${mentorWorkloads[mentor._id]} mentees`);
            }

            // Separate mentors by seniority
            const seniorMentors = mentors.filter(m => m.seniority === 'S');
            const juniorMentors = mentors.filter(m => m.seniority === 'J');
            console.log(`Senior mentors: ${seniorMentors.length}, Junior mentors: ${juniorMentors.length}`);

            // Create mentor pairs and initialize min-heap
            const mentorHeap = new MinHeap();
            const minPairs = Math.min(seniorMentors.length, juniorMentors.length);
            
            // First, create pairs of senior and junior mentors
            for (let i = 0; i < minPairs; i++) {
                const pair = {
                    mentors: [seniorMentors[i]._id, juniorMentors[i]._id],
                    mentees: [],
                    totalWorkload: mentorWorkloads[seniorMentors[i]._id] + mentorWorkloads[juniorMentors[i]._id],
                    index: i
                };
                mentorHeap.add(pair);
                console.log(`Created pair ${i + 1}: Senior ${seniorMentors[i]._id} with Junior ${juniorMentors[i]._id}`);
            }

            // Handle remaining mentors
            const remainingMentors = [
                ...seniorMentors.slice(minPairs),
                ...juniorMentors.slice(minPairs)
            ];
            console.log(`Remaining mentors to pair: ${remainingMentors.length}`);

            // Add remaining mentors in pairs
            for (let i = 0; i < remainingMentors.length; i += 2) {
                if (i + 1 < remainingMentors.length) {
                    const pair = {
                        mentors: [remainingMentors[i]._id, remainingMentors[i + 1]._id],
                        mentees: [],
                        totalWorkload: mentorWorkloads[remainingMentors[i]._id] + mentorWorkloads[remainingMentors[i + 1]._id],
                        index: mentorHeap.size()
                    };
                    mentorHeap.add(pair);
                    console.log(`Created pair ${mentorHeap.size()}: ${remainingMentors[i]._id} with ${remainingMentors[i + 1]._id}`);
                } else if (mentorHeap.size() > 0) {
                    // If there's an odd number of remaining mentors, add to last pair
                    const lastPair = mentorHeap.heap[mentorHeap.size() - 1];
                    lastPair.mentors.push(remainingMentors[i]._id);
                    lastPair.totalWorkload += mentorWorkloads[remainingMentors[i]._id];
                    mentorHeap.updateWorkload(mentorHeap.size() - 1, lastPair.totalWorkload);
                    console.log(`Added remaining mentor ${remainingMentors[i]._id} to last pair`);
                }
            }

            // Assign students to mentor pairs using min-heap
            for (const student of unassignedStudents) {
                // Get the pair with minimum workload
                const pair = mentorHeap.poll();
                if (!pair) break;

                console.log(`\nAssigning student ${student._id} to pair ${pair.index + 1} (Workload: ${pair.totalWorkload})`);

                // Initialize mentoredBy array if it doesn't exist
                if (!student.mentoredBy) {
                    student.mentoredBy = [];
                }

                // Add both mentors to the student's mentoredBy array
                for (const mentorId of pair.mentors) {
                    if (!student.mentoredBy.includes(mentorId)) {
                        student.mentoredBy.push(mentorId);
                    }
                }

                // Save the updated student
                await student.save();
                console.log(`Updated student ${student._id} with mentors: ${pair.mentors.join(', ')}`);

                // Update each mentor's student count and workload
                for (const mentorId of pair.mentors) {
                    const mentor = await Mentor.findById(mentorId);
                    if (mentor) {
                        mentor.studentCount = await Student.countDocuments({ mentoredBy: mentorId });
                        await mentor.save();
                        mentorWorkloads[mentorId] = mentor.studentCount;
                    }
                }

                // Update pair's total workload and add back to heap
                pair.totalWorkload = pair.mentors.reduce((sum, mentorId) => sum + mentorWorkloads[mentorId], 0);
                mentorHeap.add(pair);
            }

            // Verify the updates
            const updatedStudents = await Student.find({});
            console.log("\nVerifying updates:");
            for (const student of updatedStudents) {
                console.log(`Student ${student._id}: ${student.mentoredBy.length} mentors`);
            }

            return {
                success: true,
                message: `Successfully paired ${unassignedStudents.length} unassigned students with mentor pairs`
            };
        } catch (error) {
            console.error("Error in autoPairMentorsAndAssignMentees:", error);
            return {
                success: false,
                message: error.message
            };
        }
    }
};
