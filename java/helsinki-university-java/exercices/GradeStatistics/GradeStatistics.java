package exercices.GradeStatistics;

import java.util.ArrayList;

public class GradeStatistics {
    private ArrayList<Integer> points;
    
    public GradeStatistics() {
        this.points = new ArrayList<>();
    }
    
    public void add(int grade) {
        if (grade >=0 && grade <= 100) {
            this.points.add(grade);
        }
    }
    
    public double average() {
        int sum = 0;
        
        for (int point: this.points) {
            sum += point;
        }
        
        return (double) sum/this.points.size();
    }
    
    public double averagePassing() {
        int sum = 0;
        int countPassed = 0;
        
        for (int point: this.points) {
            if (point >= 50) {
                sum += point;
                countPassed++;
            }
        }
        
        return (double) sum/countPassed;
    }
    
    public double passPercentage() {
        int countPassed = 0;
        
        for (int point: this.points) {
            if (point >= 50) {
                countPassed++;
            }
        }
        
        return (double) countPassed/this.points.size()*100;
    }
    
    public void gradeDistribution() {
        int[] gradeDistribution = new int[6];
        
        
        for (int point: this.points) {
            if (point < 50) {
                gradeDistribution[0]++;
            } else if (point >= 50 && point < 60) {
                gradeDistribution[1]++;
            } else if (point >= 60 && point < 70) {
                gradeDistribution[2]++;
            } else if (point >= 70 && point < 80) {
                gradeDistribution[3]++;
            } else if (point >= 80 && point < 90) {
                gradeDistribution[4]++;
            } else {
                gradeDistribution[5]++;
            }
        }
        
        for (int i = gradeDistribution.length - 1; i >= 0; i--) {
            if (i < gradeDistribution.length - 1) {
                System.out.println("");
            }
            System.out.print(i + ": ");
            for (int j = 0; j< gradeDistribution[i]; j++) {
                System.out.print("*");
            }
        }
    }
}

