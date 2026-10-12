package bzq.shf.actions;

import java.util.HashMap;
import java.util.StringTokenizer;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;
import org.apache.log4j.NDC;
import org.apache.struts.action.Action;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.ShfBaseBean;
import bzq.shf.profile.UserProfile;


/**
 * Base action
 */
public abstract  class BaseAction extends Action {
	protected UserProfile userProfile;
	protected HashMap parameters = null;
	protected Logger logger = Logger.getLogger(BaseAction.class);
/**
 * Insert the method's description here.
 * Creation date: (19/05/2003 12:01:22)
 * @return java.lang.String
 * @param parameterName java.lang.String
 */
public String getParameter(String parameterName) {
	return (String) parameters.get(parameterName);
}
/**
 * Insert the method's description here.
 * Creation date: (15/05/2003 16:55:24)
 * @param actionMapping org.apache.struts.action.ActionMapping
 */
private void parseParameter(ActionMapping actionMapping) {

	String actionParameter = actionMapping.getParameter();
	if (actionParameter == null)
		return;
	
	StringTokenizer st = new StringTokenizer(actionParameter, ",", false);
	String key=null, value=null;
	parameters = new HashMap();

	if (st.countTokens() == 0 ) {
			StringTokenizer parameter1 = new StringTokenizer(actionParameter, " =", false);
			
			if (parameter1.hasMoreElements())
				key = parameter1.nextToken();

			if (parameter1.hasMoreElements())
				value = parameter1.nextToken();

			parameters.put(key.toLowerCase(), value);

	} else {
		
		while (st.hasMoreTokens()){
			String token = st.nextToken();
			
			StringTokenizer parameter1 = new StringTokenizer(token, " =", false);
			
			if (parameter1.hasMoreElements())
				key = parameter1.nextToken();

			if (parameter1.hasMoreElements())
				value = parameter1.nextToken();

			parameters.put(key.toLowerCase(), value);

		}
	}	
}
/*
 * Perform the action 
 */
public ActionForward perform(
    ActionMapping mapping,
    ActionForm form,
    HttpServletRequest request,
    HttpServletResponse response)
    throws java.io.IOException, javax.servlet.ServletException {
	ActionForward result = null;
    ActionErrors errors = new ActionErrors();
    String activity = null;
    //NavigatorActionManager  navigatorActionManager = new   NavigatorActionManager();
	userProfile = (UserProfile) request.getSession().getAttribute("userProfile");
    if (userProfile == null) {
        return  mapping.findForward("checkMobile");
    }
    String platform = "true".equals(((String)request.getSession().getAttribute("isMobile"))) ? "Mobile" : "Desktop";
	String ndcID =
        userProfile.getId()
            + "-"
            + userProfile.getFirstName()
            + " "
            + userProfile.getLastName()
            + "-"+platform;

    NDC.push(ndcID);
	
	logger.debug("parameter: "+mapping.getParameter());
    parseParameter(mapping);

    activity = getParameter("activity");
    //logger.debug("activity is: " + activity);

    /*if (activity == null) {
        logger.warn("Access Denied: No activity has been set");
        errors.add("security", new ActionError("shf.security.activityNotAllowed"));
        saveErrors(request, errors);
        return result = mapping.findForward("security");
    }*/

    if (form != null)
        setUserProfileDetails((ShfBaseBean) form);

    // if AccessDenied
    if (activity != null && !(userProfile.getAllowedActivities().contains(activity))) {
        //logger.error("Access Denied: activity " + activity + " not allowed");
        errors.add("security", new ActionError("shf.security.activityNotAllowed"));
        saveErrors(request, errors);
        return result = mapping.findForward("security");
    }
	
	
    ///////////////////////////////
   
    try {
        result = performAction(mapping, form, request, response);
    } catch (Exception e) {
		logger.error("Error: "+e.getMessage()+"\n",e);
		e.printStackTrace();
		if(result==null){
			result=mapping.findForward("fatalerror");
		}
    }

    NDC.pop();
    NDC.remove();
	
    return result;

}

	/*
	 * Perform the action
	 */
	public abstract ActionForward performAction( ActionMapping mapping,
	    ActionForm form,
	    HttpServletRequest request,
	    HttpServletResponse response)
	    throws java.io.IOException, javax.servlet.ServletException ;
		
	
	/**
	 * Insert the method's description here.
	 * Creation date: (24/03/2003 12:00:20)
	 * @param baseBean bzq.shf.bean.ShfBaseBean
	 */
 	protected void setUserProfileDetails(ShfBaseBean baseBean) {
	 
	    baseBean.setUserId(userProfile.getId());
	    baseBean.setUserFirstName(userProfile.getFirstName());
	    baseBean.setUserLastName(userProfile.getLastName());
	    baseBean.setAllowedActivities(userProfile.getAllowedActivities());
	    baseBean.setAllowedUnits(userProfile.getAllowedUnits());
		baseBean.setAllowedMoked(userProfile.getAllowedMoked());
		baseBean.setAllowedAgaf(userProfile.getAllowedAgaf());
	}
}
