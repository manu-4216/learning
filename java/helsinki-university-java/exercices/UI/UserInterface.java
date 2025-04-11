import java.util.Scanner;

public class UserInterface {
    private JokeManager manager;
    private Scanner scanner;
    
    public UserInterface(JokeManager manager, Scanner scanner) {
        this.manager = manager;
        this.scanner = scanner;
    }
    
    public void start() {        
        while (true) {
            System.out.println("Commands:\n1 - add a joke\n2 - draw a joke\n3 - list jokes\nX - stop");

            String command = this.scanner.nextLine();
            
            if (command.equals("X")) {
                break;
            }
            
            if (command.equals("1")) {
                System.out.println("Write the joke to be added:");
                String newJoke = this.scanner.nextLine();
                this.manager.addJoke(newJoke);
            }
            
            if (command.equals("2")) {
                System.out.println("Drawing a joke");
                String joke = this.manager.drawJoke();
                System.out.println(joke);
            }
            
            if (command.equals("3")) {
                System.out.println("Printing the jokes.");
                this.manager.printJokes();
            }
            
            System.out.println("Commands:\n1 - add a joke\n2 - draw a joke\n3 - list jokes\nX - stop");
        }
    }
}
