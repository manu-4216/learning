package exercices.GradeStatistics;

import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        GradeStatistics gradeStats = new GradeStatistics();
        UserInterface ui = new UserInterface(scanner, gradeStats);
        
        ui.start();
        
        // Write your program here -- consider breaking the program into 
        // multiple classes.
    }
}
