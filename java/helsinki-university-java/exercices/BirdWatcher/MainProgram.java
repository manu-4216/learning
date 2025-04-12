package exercices.BirdWatcher;

import java.util.Scanner;

public class MainProgram {
    private static Birds birds;
    private static Observations observations;

    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        birds = new Birds();
        observations = new Observations(birds);
        
        while (true) {
            System.out.print("?");
            String command = scan.nextLine();
            
            if (command.equals("Quit")) {
                break;
            }
            
            // Add bird
            if (command.equals("Add")) {
                System.out.print("Name: ");
                String name = scan.nextLine();
                System.out.print("Name in Latin: ");
                String latinName = scan.nextLine();
                birds.add(name, latinName);
            // Add observation
            } else if (command.equals("Observation")) {
                System.out.print("Bird? ");
                String observedBird = scan.nextLine();
                observations.add(observedBird);
            // print all birds
            } else if (command.equals("All")) {
                for (Bird bird: birds.getAll()) {
                    System.out.println(bird + ": " + observations.getCount(bird.getName()) + " observations");
                }
            // print one bird
            } else if (command.equals("One")) {
                System.out.print("Bird?");
                String name = scan.nextLine();
                Bird bird = birds.findByName(name);
                System.out.println(bird + ": " + observations.getCount(name) + " observations");
            }
        }
    }
}
