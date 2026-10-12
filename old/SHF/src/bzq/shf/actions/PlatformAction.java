package bzq.shf.actions;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.log4j.Logger;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.bean.UsageReportBean;
import bzq.shf.forms.UsageReportForm;
import bzq.shf.model.PlatformModel;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;

public class PlatformAction extends BaseAction {

	private Logger logger = Logger.getLogger(PlatformAction.class);

	@Override
	public ActionForward performAction(ActionMapping mapping, ActionForm form,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {

		String param = (String) parameters.get("param");
		UsageReportForm usageForm = null;
		PlatformModel model = null;

		ActionForward result = null;

		try {
			if ("param".equals(param)) {
				
				usageForm = (UsageReportForm) form;
				UsageReportForm storedUsageForm = (UsageReportForm) request.getSession().getAttribute("mobileUsageForm");
				if (storedUsageForm == null) {
					model = new PlatformModel(usageForm);
					model.setFormDefaults();
				} else {
					usageForm.copyForm(storedUsageForm);
				}
				request.setAttribute("mobileUsageForm",usageForm);
				
				return mapping.findForward("success");
				
			} else if ("result".equals(param)) {
				
				usageForm = (UsageReportForm) form;
				request.getSession().setAttribute("mobileUsageForm", usageForm);
				model = new PlatformModel(usageForm);
				Vector<UsageReportBean> usageRes = model.populateUsageList();
				
				request.setAttribute("usageRes",usageRes);	
				request.setAttribute("mobileUsageForm",usageForm);
				
				return mapping.findForward("success");
				
			} else if ("export".equals(param)) {
				
				usageForm = (UsageReportForm) form;
				model = new PlatformModel(usageForm);
				Vector<UsageReportBean> usageRes = model.populateUsageList();
				
				response.setContentType("application/msexcel");
				String dateTime = SHFUtils.formatDateToString(new Date(), "dd-MM-yyyy_HH-mm");
				response.setHeader("Content-Disposition","atachment;filename=shf_mobile_report_"+dateTime+".xls");
				logger.info("Exporting mobile usage stats to excel...");
				
				PrintWriter out = response.getWriter();
				if(usageRes != null){
					UsageReportBean bean = null;
					out.print("תאריך"+"\t");
					out.print("שעה"+"\t");
					out.print("שם"+"\t");
					out.print("פעולה"+"\t");
					out.print("תפקיד בפועל"+"\t");
					out.print("מוקד"+"\t");
					out.print("צוות"+"\n");
					
					
					for(int i=0;i<usageRes.size();i++){
						bean = (UsageReportBean)usageRes.get(i);
						
						out.print(SHFUtils.formatDateToString(bean.getActionDate(), "dd/MM/yyyy"));
						out.print("\t");
						out.print(SHFUtils.formatDateToString(bean.getActionDate(), "HH:mm"));
						out.print("\t");
						out.print(bean.getFname() + " " + bean.getLname());
						out.print("\t");
						out.print(bean.getActionName());
						out.print("\t");
						out.print(SHFTableUtils.getInnerJobName(bean.getInnerJobId()));
						out.print("\t");
						out.print(SHFTableUtils.getUnitName(SHFTableUtils.getMokedCodeOf(bean.getOrgUnitId())));
						out.print("\t");
						out.print(SHFTableUtils.getUnitName(bean.getOrgUnitId()));
						out.print("\t");
						out.print("\n");
					}
				}
				out.close();
				
			}
		} catch (ShfException e) {
			saveErrors(request, e.getErrors());
			result=mapping.findForward("fail");
		}
		
		return result;
	}
}
