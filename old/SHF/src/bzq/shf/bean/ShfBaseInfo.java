package bzq.shf.bean;

/**
 * Insert the type's description here.
 * Creation date: (11/11/2002 13:51:06)
 * @author: Natana Cohen
 */
 
public interface ShfBaseInfo extends bzq.forms.BaseInfo  {
	
public  java.lang.String getUserId();
public java.util.Vector getAllowedActivities();
public void setUserId( java.lang.String newUserId);
public void setAllowedActivities(java.util.Vector newAllowedActivities);

/**
 * Insert the method's description here.
 * Creation date: (02/06/2003 10:17:59)
 * @return java.lang.String
 */
public java.lang.String getSourceActivity();

public  java.lang.String getUserFirstName();

public  java.lang.String getUserLastName();

/**
 * Insert the method's description here.
 * Creation date: (02/06/2003 10:17:59)
 * @param newSourceActivity java.lang.String
 */
public void setSourceActivity(java.lang.String newSourceActivity);

public void setUserFirstName(java.lang.String newUserFirstName);

public void setUserLastName(java.lang.String newUserLastName);
}
