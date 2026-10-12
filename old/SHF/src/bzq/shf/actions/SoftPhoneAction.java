package bzq.shf.actions;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.Action;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.forms.SoftPhoneForm;
import bzq.shf.model.SoftPhoneModel;

public class SoftPhoneAction extends Action {

    public ActionForward perform(ActionMapping mapping,
			 ActionForm form,
			 HttpServletRequest request,
			 HttpServletResponse response)
    throws IOException, ServletException {
		
		ActionForward result = null;
		String param = mapping.getParameter().split("=")[1];
		SoftPhoneForm softPhoneForm = (SoftPhoneForm)form;
		SoftPhoneModel model = new SoftPhoneModel(softPhoneForm);
		
		if ("timeActual".equals(param)) {
			model.updateTimeActual();
		}
		else if ("logout".equals(param)) {
			model.logout();
		}
			
		return result;
	}


}
