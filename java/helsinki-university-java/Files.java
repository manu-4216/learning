import java.nio.file.Paths;
import java.util.Scanner;

public class Files {
  public void main() {
    // try-with-resource: simplified way to manage resources (like files, sockets, or database connections) that must be closed when no longer needed.
    // Any class that implements the AutoCloseable or Closeable interface can be used within a try-with-resources block.
    // Scanner implements AutoCloseable, meaning it will automatically close itself at the end of the try block, even if an exception occurs.
    try (Scanner scanner = new Scanner(Paths.get("file.txt"))) {

        // we read the file until all lines have been read
        while (scanner.hasNextLine()) {
            // we read one line
            String row = scanner.nextLine();

            // if the line is blank we can ignore it
            if (row.isEmpty()) {
                continue;
            }

            // do something with the data
            System.out.println(row);
        }
    } catch (Exception e) {
        System.out.println("Error: " + e.getMessage());
    }
  }
}
