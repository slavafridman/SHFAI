package bzq.shf.actions;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.OptShSpFlagBean;
import bzq.shf.forms.OptShfSpForm;
import bzq.shf.model.OptShfSpModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.ShfException;

public class OptShfSpAction extends BaseAction {

	@Override
	public ActionForward performAction(ActionMapping mapping, ActionForm form,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {
		
		ActionForward result = null;
		String param = (String)parameters.get("param");
		OptShfSpForm optShfSpForm = (OptShfSpForm)form;
		optShfSpForm.setUserProfile(userProfile);
		OptShfSpModel model = new OptShfSpModel(optShfSpForm);
//		HttpSession session = request.getSession();
		
		response.setHeader("Cache-Control","no-cache");
		response.setHeader("Pragma","no-cache");
		response.setContentType("text/html;charset=WINDOWS-1255");
		
		if("view".equals(param)) {
			
			Vector<String> myMokedUnits = null;
			Vector<OptShSpFlagBean> beanVec = null;
			Map<String, Boolean> res = null;
			
			try {
				myMokedUnits = model.getAllowedMokedOrSingle();
				beanVec = model.populateByUnitCodeVec(myMokedUnits);
				res = new HashMap<String, Boolean>();
			} catch (ShfException e) {
				saveErrors(request,e.getErrors());
			}
			
			for (String myMokedUnit : myMokedUnits) {
				if (beanVec != null) {
					boolean found = false;
					for (OptShSpFlagBean optShSpFlagBean : beanVec) {
						if(myMokedUnit.equals(optShSpFlagBean.getOrgUnitCode())) {
							res.put(myMokedUnit, optShSpFlagBean.isFlagEnabled());
							found = true;
							break;
						}
					}
					if ( ! found) {
						res.put(myMokedUnit, null);
					}
				} else {
					res.put(myMokedUnit, false);
				}
			}
			request.setAttribute("allowedUnits", res);
			return mapping.findForward("successView");
			
		} else if("update".equals(param)) {
			try {
				model.updateOptSHFSPFlag(getServlet().getServletContext());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.generalSuccessMsg"));
				saveErrors(request,actionErrors);
			} catch (ShfException e) {
				saveErrors(request,e.getErrors());	
			}

			
			
			return mapping.findForward("successUpdate");
		}
		
		
		
		
		return result;
	}

}
