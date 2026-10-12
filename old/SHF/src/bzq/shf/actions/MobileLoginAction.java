package bzq.shf.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.struts.action.Action;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

public class MobileLoginAction extends Action {
	
	public ActionForward perform(
			ActionMapping mapping,
			ActionForm form,
			HttpServletRequest request,
			HttpServletResponse response)
			throws java.io.IOException, javax.servlet.ServletException {
		
		ActionForward result = mapping.findForward("loginSuccessful");
		
		HttpSession session = request.getSession();				
		if (session.isNew() || session.getAttribute("isMobile") == null) {
			session.setAttribute("isMobile", "true");
			session.setAttribute("mobileLogin", "true");
		}
		
		return result;
	}

}
