import java.util.Scanner;

public class ScannerExample {
  public static void main(String[] args) {
      Scanner scanner = new Scanner(System.in);
      String text = scanner.nextLine();
      int integer = Integer.valueOf(scanner.nextLine());
      double floatingPoint = Double.valueOf(scanner.nextLine());
      boolean trueOrFalse = Boolean.valueOf(scanner.nextLine());

      scanner.close();
  }
}