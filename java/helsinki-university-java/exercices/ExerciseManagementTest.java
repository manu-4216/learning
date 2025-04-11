package exercices;

public import org.junit.Test;
import org.junit.Before;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;


public class ExerciseManagementTest {
    private ExerciseManagement management;
    
    @Before
    public void initialize() {
        management = new ExerciseManagement();
    }
    
    @Test
    public void emptyAtStart() {
        assertEquals(0, management.exerciseList().size());
    }
    
    @Test
    public void addingExerciseGrowsListByOne() {
        management.add("Write a test");
        assertEquals(1, management.exerciseList().size());
    }
    
    @Test
    public void addedExerciseIsInList() {
        management.add("Write a test");
        assertTrue(management.exerciseList().contains("Write a test"));
    }
    
    @Test
    public void markAsComplete() {
        management.add("Write a test");
        management.markAsCompleted("Write a test");
        assertTrue(management.isCompleted("Write a test"));
    }
    
    @Test
    public void defaulNotComplete() {
        management.add("Some task");
        assertFalse(management.isCompleted("Some task"));
    }
}
 ExercisesTest {
  
}
