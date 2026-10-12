package bzq.shf.actions;

import java.io.IOException;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.PeleIWDBean;
import bzq.shf.forms.PeleIWDForm;
import bzq.shf.model.IWDModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.ShfException;

public class IWDAction extends BaseAction {
	
	private Logger logger = Logger.getLogger(IWDAction.class);

	@Override
	public ActionForward performAction(ActionMapping mapping, ActionForm form,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {
		
		String param = (String) parameters.get("param");
		PeleIWDForm peleIWDForm = (PeleIWDForm) form;
		ActionForward result = null;
		
		try {
			if ("pele_param".equals(param)) {
				PeleIWDForm peleIWDFormStored = null;
				peleIWDFormStored = (PeleIWDForm) request.getSession().getAttribute("peleIWDFormStored");
				request.setAttribute("iwdLimit", String.valueOf(SHFConstants.TIMING_IWD_LIMIT));
				if (peleIWDFormStored == null) {
					peleIWDFormStored = new PeleIWDForm();
					peleIWDFormStored.setUserId(userProfile.getId());
					IWDModel model = new IWDModel(peleIWDFormStored);
					model.setFormDefaults();
					request.setAttribute("peleIWDForm", peleIWDFormStored);
					
					return mapping.findForward("success");		// 1st time display nothing
				} else {
					peleIWDForm.copyForm(peleIWDFormStored);
					request.setAttribute("peleIWDForm", peleIWDForm);
					return mapping.findForward("result");
				}
			} else if ("pele_result".equals(param)) {
				response.setHeader("Cache-Control","no-cache");
				response.setHeader("Pragma","no-cache");

				PeleIWDForm schedForm = null;
				if (request.getAttribute("peleIWDFormSched") != null) {
					schedForm = (PeleIWDForm)request.getAttribute("peleIWDFormSched");
				} else {
					schedForm = peleIWDForm;
				}
				IWDModel model = new IWDModel(schedForm);
				Vector<PeleIWDBean> empAndModules = model.getEmpAndModules(null);

				request.getSession().setAttribute("peleIWDFormStored", schedForm);
				request.setAttribute("iwdLimit", String.valueOf(SHFConstants.TIMING_IWD_LIMIT));
				request.setAttribute("empAndModules", empAndModules);
				request.setAttribute("peleIWDForm", schedForm);
				return mapping.findForward("success");
				
			} else if ("pele_schedule".equals(param)) {
				PeleIWDForm peleIWDFormStored = null;
				peleIWDFormStored = (PeleIWDForm) request.getSession().getAttribute("peleIWDFormStored");
				PeleIWDForm schedForm = new PeleIWDForm();
				schedForm.copyForm(peleIWDFormStored);
				schedForm.setUserFirstName(((PeleIWDForm)form).getUserFirstName());
				schedForm.setUserLastName(((PeleIWDForm)form).getUserLastName());
				schedForm.setUserId(((PeleIWDForm)form).getUserId());
				schedForm.setAllowedActivities(((PeleIWDForm)form).getAllowedActivities());
				
				schedForm.setModuleId(peleIWDForm.getModuleId());
				schedForm.setMokedId(peleIWDForm.getMokedId());
				schedForm.setInnerJobId(peleIWDForm.getInnerJobId());
				schedForm.setAmountPerTiming(peleIWDForm.getAmountPerTiming());
				schedForm.setIntervalSize(peleIWDForm.getIntervalSize());
				schedForm.setTotalForTiming(peleIWDForm.getTotalForTiming());
				
				IWDModel model = new IWDModel(schedForm);
				try {
					model.doSchedule();
				}catch(ShfException e){
					saveErrors(request,e.getErrors());
				}				
				
				request.setAttribute("peleIWDFormSched", schedForm);
				return mapping.findForward("success");
			} else if ("pele_schedule_cancel".equals(param)) {
				IWDModel model = new IWDModel(peleIWDForm);
				try {
					model.doScheduleCancel();
				} catch (ShfException e) {
					saveErrors(request,e.getErrors());
				}
				
				return mapping.findForward("success");
			}
			

		} catch (ShfException e) {
			saveErrors(request, e.getErrors());
			result = mapping.findForward("fail");
		}
	
		return result;
	}

}
