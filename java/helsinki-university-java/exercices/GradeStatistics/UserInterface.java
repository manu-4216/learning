package exercices.GradeStatistics;

import java.util.Scanner;

public class UserInterface {
    private Scanner scanner;
    private GradeStatistics gradeStats;
    
    public UserInterface(Scanner scanner, GradeStatistics gradeStats) {
        this.scanner = scanner;
        this.gradeStats = gradeStats;
    }
    
    public void start() {
        System.out.println("Enter point totals, -1 stops:");
        while (true) {
            int number = Integer.valueOf(this.scanner.nextLine());

            if (number == -1) {
                this.printResult();
                
                break;
            }

            gradeStats.add(number);
        }
    }
   
    public void printResult() {
        double average = gradeStats.average();
        System.out.println("Point average (all): " + average);
        
        double averagePassing = gradeStats.averagePassing();
        String averagePassingString;
        if (Double.isNaN(averagePassing)) {
            averagePassingString = "-";
        } else {
            averagePassingString = String.valueOf(averagePassing);
        }
        System.out.println("Point average (passing): " + averagePassingString);
        
        double passPercentage = gradeStats.passPercentage();
        System.out.println("Pass percentage: " + passPercentage);
        
        System.out.println("Grade distribution:");
        gradeStats.gradeDistribution();
    }

}

