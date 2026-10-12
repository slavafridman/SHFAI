/*
 * Created on 13/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CheckBoxTag extends BaseHandlerTag{
	
	protected String inputname;
	protected int checked;
	protected String logic;
	protected String name;
	protected String property;
	
	public int doStartTag() throws JspException {
		StringBuffer results = new StringBuffer();
		Object obj;
		Boolean b=new Boolean(false);
		String str="";
		if(name!=null && property!=null){
			obj = (Object)RequestUtils.lookup(pageContext, name, property, null);
			if(obj instanceof Boolean)
				b=(Boolean)obj;
			else if(obj instanceof Integer)
				b=new Boolean(((Integer)obj).intValue()==1);
			
			str=b.booleanValue()?"checked":"";
		}else{
			str=checked>0?"checked":"";
		}
		
		if(logic==null) logic="";
		results.append("<input type=checkbox name=\""+inputname+"\" "+str+" "+logic+" />");
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);
	}
	

	/**
	 * @return
	 */
	public String getInputname() {
		return inputname;
	}

	

	/**
	 * @param string
	 */
	public void setInputname(String string) {
		inputname = string;
	}

	/**
	 * @return
	 */
	public String getLogic() {
		return logic;
	}

	/**
	 * @param string
	 */
	public void setLogic(String string) {
		logic = string;
	}

	/**
	 * @return
	 */
	public int getChecked() {
		return checked;
	}

	/**
	 * @param i
	 */
	public void setChecked(int i) {
		checked = i;
	}

	/**
	 * @return
	 */
	public String getName() {
		return name;
	}

	/**
	 * @return
	 */
	public String getProperty() {
		return property;
	}

	/**
	 * @param string
	 */
	public void setName(String string) {
		name = string;
	}

	/**
	 * @param string
	 */
	public void setProperty(String string) {
		property = string;
	}

}
