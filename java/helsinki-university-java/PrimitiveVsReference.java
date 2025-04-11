class Person {
  private int age;
  private String name;

  public Person(String name) {
    this.name = name;
  }
  public void growOlder() {
    age++;
  }
}

public class PrimitiveVsReference {
  public static void main() {
    // reference
    Person person1 = new Person("Joan Ball");
    System.out.println(person1); // Joan Ball, age 0 years

    // copy of reference, pointing to same object location
    Person person2 = person1;
    // Modifying the shared Object:
    person2.growOlder();
    person2.growOlder();

    System.out.println(person1); // Joan Ball, age 2 years

    // new assignment of person1. The person2 still points to the other memory location
    person1 = new Person("Joan B.");
    System.out.println(person1); // Joan B., age 0 years


    // ANOTHER USE CASE:
    Person joan = new Person("Joan Ball");
    System.out.println(joan);

    joan = null;
    joan.growOlder(); // Exception in thread "main" java.lang.NullPointerException
  }
}
