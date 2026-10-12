package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.profile.UserProfile;



/**
 * תג הבודק האם הפעילות של המשתמש מותרת לו.
 * אם כן הוא יצייר את גוף התג (בד"כ כפתורים) ואם לא ישרטט את גוף התג
 * Creation date: (11/05/2003 12:29:30)
 * @author: Slava Fridman
 */
public class SecurityTag extends javax.servlet.jsp.tagext.TagSupport{

	public String activity;
	
/**
 * Creation date: (30/12/2002 13:58:15)
 * @return int
 * @exception javax.servlet.jsp.JspException The exception description.
 */
	public int doStartTag() throws javax.servlet.jsp.JspException{
//Getting vector of activities
	UserProfile userProfile = (UserProfile) pageContext.getSession().getAttribute("userProfile");
	Vector activities = (Vector) userProfile.getAllowedActivities();

	//Checking if current activity exist in vector
		if (activities.contains(activity)){
			return EVAL_BODY_INCLUDE;
		} else //No printing tag body 
		{
			return SKIP_BODY;
		}
	}

	public String getActivity() {
		return activity;
	}
	
	public void setActivity(String newActivity) {
		activity = newActivity;
	}
}