import java.util.ArrayList;
import java.util.Collections;

public class ArrayListExample {
  public static void main(String[] args) {
    // Create
    ArrayList<Integer> list = new ArrayList<>();

    // Add
    list.add(1);
    list.add(2);
    list.add(3);

    // Size
    System.out.println(list.size()); // 3

    // Get elements
    list.get(1); // 2

    // This does not work
    list[1];

    // Iterate
    for (int n: list) {
      System.out.println(n); // 1,2,3
    }

    for (int i = 0; i< list.size(); i++) {
      System.out.println(list.get(i)); // 1,2,3
    }

    // Remove element by index (if passing an integer primitive)
    list.remove(2); // New arraylist: [1, 2]

    // Remove element by value
    list.remove(Integer.valueOf(2)); // New arraylist: [1]

    // Contains
    list.contains(1); // true
    // NOTE: .contains checks by using .equals, which checks the value for primitives, and reference for reference objects.

    System.out.println(list); // [1]

    // Sort
    Collections.sort(list);
  }
}
